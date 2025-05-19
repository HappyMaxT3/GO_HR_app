# HR Database Application (Go)

This project is a simple command-line application built with Go that allows you to manage an HR database. Currently, it provides functionalities for managing:

* Absence Types
* Education Types
* Employee Contact Types

This application is containerized using Docker for easy setup and deployment.

## Getting Started

### Prerequisites

* **Docker:** Make sure you have Docker installed on your system. You can find installation instructions for your operating system on the [official Docker website](https://docs.docker.com/get-docker/).
* **Docker Compose:** Docker Compose is used to manage the application's services. It is usually installed along with Docker Desktop. If you need to install it separately, follow the instructions on the [Docker Compose installation page](https://docs.docker.com/compose/install/).

### Running the Application with Docker Compose

The easiest way to run this application is using Docker Compose. Follow these steps:

1.  **Clone the repository:** If you haven't already, clone the repository containing the `docker-compose.yml` and other project files to your local machine.

    ```bash
    git clone <your_repository_url>
    cd <your_repository_directory>
    ```

2.  **Start the services:** Navigate to the directory containing the `docker-compose.yml` file and run the following command:

    ```bash
    docker-compose up
    ```

    This command will build the Docker image for the Go application (if it hasn't been built before), create and start the PostgreSQL database container (`my_hr_db_container`), and the Go application container (`my_hr_app_container`). The `-d` flag can be added to run the containers in detached mode (in the background).

3.  **Accessing the application:** Once the containers are running, you can interact with the Go application. If you didn't use the `-d` flag, you should see the application's main menu in your terminal. If you ran it in detached mode, you can attach to the application container to see the output and provide input:

    ```bash
    docker attach my_hr_app_container
    ```

    To detach from the container without stopping it, press `Ctrl+P` followed by `Ctrl+Q`.

## Configuration

The application uses environment variables for database configuration. These are defined in the `docker-compose.yml` file and can be overridden by creating a `.env` file in the same directory. The following environment variables are used:

* `DB_HOST`: The hostname or IP address of the PostgreSQL database server (within the Docker network, this is `db`).
* `DB_PORT`: The port number of the PostgreSQL database server (default is `5432`).
* `DB_USER`: The username for connecting to the PostgreSQL database.
* `DB_PASSWORD`: The password for the PostgreSQL database user.
* `DB_NAME`: The name of the PostgreSQL database to use.
* `DB_SSLMODE`: The SSL mode for the database connection (e.g., `disable`, `require`).

You can create a `.env` file with your specific database credentials:
