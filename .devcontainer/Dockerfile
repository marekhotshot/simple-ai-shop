# params used in both images
ARG NODE_MAJOR_VERSION=20 
ARG HTTP_PROXY
ARG HTTPS_PROXY

####################
# START BASE IMAGE #
####################
ARG BASE_REGISTRY=docker-hub.nexinsure.org/library
FROM ${BASE_REGISTRY}/ubuntu:22.04 AS base

ARG NODE_MAJOR_VERSION
ARG HTTP_PROXY
ARG HTTPS_PROXY

# set proxy
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV CURL_CA_BUNDLE=/usr/local/share/ca-certificates/extra/combined.pem
ENV GIT_SSL_CAINFO=/usr/local/share/ca-certificates/extra/combined.pem
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/extra/combined.pem
ENV NODE_OPTIONS=--use-openssl-ca

# install needed dependencies
RUN apt update && apt full-upgrade -y \
    && apt install -y --no-install-recommends curl \
    gpg \
    ca-certificates \
    && update-ca-certificates

# settings msn certificate
RUN mkdir -p /usr/local/share/ca-certificates/extra/ \
	&& (curl -fsSL http://cloud.msg.team/zertifikat/zscaler.crt -o /usr/local/share/ca-certificates/extra/zscaler.crt || \
	   echo "Skipping zscaler.crt download - ensure CA is mounted or baked in") \
    && update-ca-certificates 2>&1 || true

# convert to crt to pem and create combined.pem for npm/git
RUN openssl x509 -in /usr/local/share/ca-certificates/extra/zscaler.crt -out /usr/local/share/ca-certificates/extra/zscaler.pem -outform PEM 2>/dev/null || true \
    && cat /etc/ssl/certs/ca-certificates.crt > /usr/local/share/ca-certificates/extra/combined.pem 2>/dev/null || true \
    && cat /usr/local/share/ca-certificates/extra/zscaler.pem >> /usr/local/share/ca-certificates/extra/combined.pem 2>/dev/null || true

# add nodejs repository
RUN mkdir -p /etc/apt/keyrings && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR_VERSION}.x nodistro main" \
    | tee /etc/apt/sources.list.d/nodesource.list

# install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && chmod +x kubectl \
    && mv kubectl /usr/local/bin/kubectl

# install all needed packages
RUN apt update && apt install -y --no-install-recommends sudo \
    locales \
    locales-all \
    git \
    vim \
    zip \
    unzip \
    less \
    nodejs \
    && apt autoclean -y && apt --purge autoremove -y && rm -rf /var/lib/apt/lists/*

# ensure git and npm trust corporate CA and proxies (if provided)
RUN git config --system http.sslCAInfo "/usr/local/share/ca-certificates/extra/combined.pem" \
    && git config --system http.sslVerify true \
    && if [ -n "$HTTP_PROXY" ]; then git config --system http.proxy "$HTTP_PROXY"; fi \
    && if [ -n "$HTTPS_PROXY" ]; then git config --system https.proxy "$HTTPS_PROXY"; fi \
    && npm config set cafile "/usr/local/share/ca-certificates/extra/combined.pem" \
    && npm config set strict-ssl true

# configure proxy (if set)
RUN if [ ! "x" = "x$HTTP_PROXY" ] && [ ! "x" = "x$HTTPS_PROXY" ]; then \
        npm config set proxy "$HTTP_PROXY"; \
        npm config set https-proxy "$HTTPS_PROXY"; \
    fi

# create nex user
RUN groupadd nex \
    && useradd -m -g nex -s /bin/bash nex \
    && usermod -aG sudo nex

# create folders
RUN mkdir -p /usr/local/share/ca-certificates/msn \
    && mkdir -p /home/nex/.ssh \
    && mkdir -p /home/nex/.cursor-server \
    && chown -R nex:nex /home/nex \
    && chmod 0700 /home/nex/.ssh \
    && chmod 755 /home/nex/.cursor-server

COPY .devcontainer/files/sudoers /etc/sudoers.d/nex

# updating settings
RUN chmod 440 /etc/sudoers.d/nex
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
    && dpkg-reconfigure --frontend=noninteractive locales \
    && update-locale LANG=en_US.UTF-8

# create deployment dir and switch working directory
USER nex
WORKDIR /home/nex

# add environment variables in bash
RUN echo "# Adding customization\n\
PATH=\$PATH:/home/nex/.local/bin\n\
LANG=en_US.UTF-8\n\
LC_ALL=en_US.UTF-8\n\
REQUESTS_CA_BUNDLE=/usr/local/share/ca-certificates/extra/combined.pem\n\
NODE_OPTIONS=--use-openssl-ca\n\
export PATH LANG LC_ALL REQUESTS_CA_BUNDLE NODE_OPTIONS\n\
" >> /home/nex/.bashrc

CMD ["/bin/bash"]
