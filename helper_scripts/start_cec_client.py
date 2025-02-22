import time
import subprocess

# Wait to ensure everything is fully loaded
time.sleep(10)

# Start tmux session if it doesn't exist
session_name = "cec_session"
check_session = subprocess.run(["tmux", "has-session", "-t", session_name], capture_output=True)

if check_session.returncode != 0:
    # Create a new tmux session and run cec-client
    subprocess.run(["tmux", "new-session", "-d", "-s", session_name, "cec-client -o RaspberryPi -d 1"])
