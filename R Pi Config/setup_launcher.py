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
import os
import shutil
import configparser


def copy_firefox_profile(new_profile_name, source_profile="backup.profile"):
    \"\"\"Creates a new profile based off of the default profile\"\"\"
    profile_dir = os.path.expanduser("~/.mozilla/firefox/")
    source_path = os.path.join(profile_dir, source_profile)
    new_path = os.path.join(profile_dir, new_profile_name)

    if not os.path.exists(source_path):
        print(f"Error: Source profile '{source_profile}' not found.")
        return

    if os.path.exists(new_path):
        shutil.rmtree(new_path)  # Remove existing profile to overwrite

    # Copy profile folder
    shutil.copytree(source_path, new_path)
    print(f"Copied '{source_profile}' to '{new_profile_name}'.")

    # Update profiles.ini
    profiles_ini_path = os.path.join(profile_dir, "profiles.ini")
    if not os.path.exists(profiles_ini_path):
        print("Error: profiles.ini not found.")
        return

    config = configparser.ConfigParser()
    config.read(profiles_ini_path)

    # Find the next available profile index
    index = 0
    while f'Profile{index}' in config:
        index += 1

    # Add new profile entry
    config[f'Profile{index}'] = {
        'Name': new_profile_name,
        'IsRelative': 1,
        'Path': new_profile_name,
        'Default': 0
    }

    with open(profiles_ini_path, 'w') as configfile:
        config.write(configfile)

    print(f"Updated profiles.ini with new profile '{new_profile_name}'.")

def sync_firefox_settings(source_profile="backup.profile"):
    \"\"\"Copies the settings from the backup profile into each of the other profiles\"\"\"
    profile_dir = os.path.expanduser("~/.mozilla/firefox/")
    source_path = os.path.join(profile_dir, source_profile)
    extensions_folder = os.path.join(source_path, "extensions")
    prefs_file = os.path.join(source_path, "prefs.js")
    search_file = os.path.join(source_path, "search.json.mozlz4")

    for profile in os.listdir(profile_dir):
        profile_path = os.path.join(profile_dir, profile)

        # Exclude non-profile directories and specific folders
        if not os.path.isdir(profile_path) or profile in {source_profile, "Crash Reports", "Pending Pings"}:
            continue

        dest_extensions = os.path.join(profile_path, "extensions")
        dest_prefs = os.path.join(profile_path, "prefs.js")
        dest_search = os.path.join(profile_path, "search.json.mozlz4")

        if os.path.exists(extensions_folder):
            shutil.copytree(extensions_folder, dest_extensions, dirs_exist_ok=True)

        if os.path.exists(prefs_file):
            shutil.copy2(prefs_file, dest_prefs)

        if os.path.exists(search_file):
            shutil.copy2(search_file, dest_search)

        print(f"Copied settings to '{profile}'.")

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
        if app_name == "createProfile":
            if not args:
                print("No profile name provided.")
                sys.exit(1)
            copy_firefox_profile(args)
            return

        if app_name == "syncAllProfiles":
            sync_firefox_settings(args)
            return

        # Special case for launching Firefox in kiosk mode
        if app_name == "firefox":
            if "/" in args:
                profile_name, url_to_open = args.split("/", 1)  # Split only on the first "/"
            else:
                profile_name = args if args else "default"
                url_to_open = "https://example.com"  # Default URL if none provided

            command = [
                "firefox",
                "-P", profile_name,
                "--no-remote",
                "--new-instance",
                "--kiosk",
                url_to_open
            ]
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
    print("For example, use launcher://firefox/userName/https://youtube.com to launch Firefox in kiosk mode.")
    print("To create a new Firefox profile, use launcher://createProfile/NewProfileName")

if __name__ == "__main__":
    setup_launcher()
