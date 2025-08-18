# Project: FluentLeap - Digital English Academy

## Project Overview

This project is a single-page web application (SPA) designed as a comprehensive platform for learning English. It provides users with interactive lessons, level-based courses, a community forum, and personal progress tracking. The application is built with modern vanilla JavaScript (ESM), HTML5, and CSS, and it is designed to be fully responsive.

The application features a clean and modern user interface, with a focus on user experience. It includes an onboarding process that uses a chat-based interface to create a personalized learning plan for each user. The core learning experience is enhanced with AI-powered features, such as a tutor that can define words and phrases on the fly and a generator for creating new exercises based on the user's interests.

The application is structured with a clear separation of concerns, with dedicated files for routing, state management, components, and different views. It also includes a `Dockerfile` for easy containerization and deployment.

## Building and Running

This is a static web application that can be run using any simple HTTP server. The `Dockerfile` provided in the project also offers a straightforward way to build and run the application in a containerized environment.

### Running with a Simple HTTP Server

1.  Navigate to the project's root directory.
2.  Start a simple HTTP server. For example, using Python:

    ```bash
    python -m http.server
    ```

3.  Open your web browser and go to `http://localhost:8000`.

### Building and Running with Docker

1.  Make sure you have Docker installed and running on your system.
2.  Open a terminal and navigate to the project's root directory.
3.  Build the Docker image:

    ```bash
    docker build -t fluentleap .
    ```

4.  Run the Docker container:

    ```bash
    docker run -p 8080:80 fluentleap
    ```

5.  Open your web browser and go to `http://localhost:8080`.

## Development Conventions

*   **Code Style:** The project uses modern JavaScript (ESM) with a focus on readability and maintainability. It follows a modular approach, with features and components separated into different files.
*   **File Structure:** The project is organized into the following directories and files:
    *   `index.html`: The main entry point of the application.
    *   `app.js`: The main application logic, including the initialization of the router and other components.
    *   `router.js`: Handles the client-side routing and navigation.
    *   `state.js`: Manages the application's global state.
    *   `components.js`: Contains reusable UI components.
    *   `views/`: A directory containing the different views of the application (e.g., home, courses, lesson).
    *   `styles.css`: The main stylesheet for the application.
    *   `Dockerfile`: For containerizing the application.
*   **Dependencies:** The project uses a few external libraries, which are imported using an import map in `index.html`. These include `dayjs` for date and time manipulation and `phosphor-icons` for iconography.
*   **AI Features:** The application uses a simulated API (`websim`) to provide AI-powered features. This allows for the development and testing of these features without the need for a live backend.
