import os
import subprocess

# Paths
HOME_DIR = os.path.expanduser("~")
APPLICATIONS_DIR = os.path.join(HOME_DIR, ".local/share/applications")
DESKTOP_FILE_PATH = os.path.join(APPLICATIONS_DIR, "launcher.desktop")
MIMEAPPS_FILE_PATH = os.path.join(APPLICATIONS_DIR, "mimeapps.list")
HANDLER_SCRIPT_PATH = os.path.join(HOME_DIR, "launcher.py")

def create_launcher_script():
    """
    Create the main launcher script to handle 'launcher://' URL scheme.
    """
    launcher_script_content = """#!/usr/bin/env python3
import sys
import subprocess
import urllib.parse
import time

def press_f11():
    \"\"\"Simulate pressing the F11 key using xdotool.\"\"\"
    try:
        subprocess.run(["xdotool", "key", "F11"])
    except FileNotFoundError:
        print("xdotool is not installed. Please install it to enable fullscreen mode.")
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("No URL provided.")
        sys.exit(1)

    # Extract the launcher URL
    url = sys.argv[1]
    if not url.startswith("launcher://"):
        print("Invalid URL scheme. Use launcher://")
        sys.exit(1)

    # Parse the URL to get the application name and arguments
    parsed_url = urllib.parse.urlparse(url)
    app_name = parsed_url.netloc  # The app to launch
    args = urllib.parse.unquote(parsed_url.path[1:])  # Arguments after the first '/'

    if not app_name:
        print("No application specified in the URL.")
        sys.exit(1)

    try:
        # Special case for launching Firefox in fullscreen mode
        if app_name == "firefox":
            url_to_open = args if args else "https://example.com"  # Default URL if none provided

            # Launch Firefox
            subprocess.Popen(["firefox", url_to_open])

            # Wait for Firefox to load, then simulate F11 key press
            time.sleep(5)  # Adjust this if needed for slower systems
            press_f11()
        else:
            # Run other applications normally
            command = [app_name] + args.split() if args else [app_name]
            subprocess.run(command)
    except FileNotFoundError:
        print(f"Application not found: {app_name}")
        sys.exit(1)

if __name__ == "__main__":
    main()
"""
    # Save the launcher script
    with open(HANDLER_SCRIPT_PATH, "w") as f:
        f.write(launcher_script_content)
    os.chmod(HANDLER_SCRIPT_PATH, 0o755)

def create_desktop_file():
    """
    Create the .desktop file to register the 'launcher://' URL scheme.
    """
    desktop_file_content = f"""[Desktop Entry]
Name=Launcher Handler
Exec={HANDLER_SCRIPT_PATH} %u
Type=Application
MimeType=x-scheme-handler/launcher;
"""
    os.makedirs(APPLICATIONS_DIR, exist_ok=True)
    with open(DESKTOP_FILE_PATH, "w") as f:
        f.write(desktop_file_content)

def create_mimeapps_list():
    """
    Create or update the mimeapps.list file with the custom URL scheme.
    """
    mimeapps_content = "[Added Associations]\nx-scheme-handler/launcher=launcher.desktop\n"
    with open(MIMEAPPS_FILE_PATH, "w") as f:
        f.write(mimeapps_content)

def register_url_scheme():
    """
    Register the custom URL scheme with the system.
    """
    subprocess.run(["xdg-mime", "default", "launcher.desktop", "x-scheme-handler/launcher"])

def setup_launcher():
    """
    Set up the custom URL scheme and handler.
    """
    print("Creating launcher script...")
    create_launcher_script()
    print("Creating .desktop file...")
    create_desktop_file()
    print("Creating mimeapps.list file...")
    create_mimeapps_list()
    print("Registering the custom URL scheme...")
    register_url_scheme()
    print("Setup complete! Use launcher://<app_name> to open apps.")
    print("For example, use launcher://firefox/https://youtube.com to launch Firefox in fullscreen mode.")

if __name__ == "__main__":
    setup_launcher()
