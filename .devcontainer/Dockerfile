FROM mcr.microsoft.com/playwright:v1.58.0-noble

ARG USERNAME=pwuser
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create non-root user
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && apt-get update \
    && apt-get install -y sudo \
    && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Pre-warm npm cache
COPY package.json package-lock.json /tmp/build/
RUN cd /tmp/build && npm ci --prefer-offline --ignore-scripts \
    && cp -r /root/.npm /home/$USERNAME/.npm \
    && chown -R $USERNAME:$USERNAME /home/$USERNAME/.npm \
    && rm -rf /tmp/build

# Pre-install Playwright CLI browsers
RUN mkdir -p /ms-playwright-cli \
    && chown -R $USERNAME:$USERNAME /ms-playwright-cli

WORKDIR /workspace

USER $USERNAME
