# Use an official Rust image as the build environment
FROM rust:latest as builder

# Set the working directory
WORKDIR /app

# Copy the project files into the Docker image
COPY . .

# Build the Rust project
RUN cargo build --release

# Download and install Fluence Aqua CLI
RUN curl -sSL https://github.com/fluencelabs/aqua/archive/refs/tags/aqua-v0.14.7.zip -o aqua-aqua-v0.14.7.zip && \
    unzip aqua-aqua-v0.14.7.zip 

# Stage 2: Create a minimal image for running the Fluence services
FROM debian:buster-slim

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the built binary from the builder stage
COPY --from=builder /app/target/release/your_project_binary /usr/local/bin/your_project_binary

# Copy Aqua scripts and other necessary files
COPY --from=builder /app/aqua /usr/local/bin/aqua
COPY --from=builder /app/scripts /usr/local/bin/scripts

# Expose necessary ports (change as needed)
EXPOSE 8080

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/your_project_binary"]

# CMD if needed to run Aqua scripts or services
# CMD ["aqua", "run", "-f", "runDeployedServices(3, 5)"]
