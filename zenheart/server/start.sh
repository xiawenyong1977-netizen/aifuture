#!/bin/bash

# ZenHeart Backend Startup Script
# This script starts the FastAPI application in background

# Configuration
APP_DIR="/opt/zenheart/server"
VENV_DIR="$APP_DIR/venv"
LOG_FILE="/var/log/zenheart.log"
PID_FILE="/var/run/zenheart.pid"

# Function to check if service is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        if kill -0 $(cat "$PID_FILE") > /dev/null 2>&1; then
            return 0
        else
            rm "$PID_FILE"
        fi
    fi
    return 1
}

# Function to stop service
stop_service() {
    if is_running; then
        echo "Stopping ZenHeart service..."
        kill $(cat "$PID_FILE")
        sleep 2
        rm -f "$PID_FILE"
        echo "ZenHeart service stopped."
    else
        echo "ZenHeart service is not running."
    fi
}

# Function to start service
start_service() {
    if is_running; then
        echo "ZenHeart service is already running."
        exit 1
    fi

    # Create log directory if it doesn't exist
    mkdir -p $(dirname "$LOG_FILE")

    # Activate virtual environment and start server
    echo "Starting ZenHeart service..."
    nohup $VENV_DIR/bin/python main.py > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo "ZenHeart service started. PID: $(cat "$PID_FILE")"
}

# Function to restart service
restart_service() {
    stop_service
    start_service
}

# Function to check status
check_status() {
    if is_running; then
        echo "ZenHeart service is running (PID: $(cat "$PID_FILE"))"
    else
        echo "ZenHeart service is not running."
    fi
}

# Main script logic
case "$1" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        check_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac

exit 0