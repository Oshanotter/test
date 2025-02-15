import os
import subprocess
import zipfile
import urllib.request
import configparser
from pathlib import Path

# Paths
HOME_DIR = os.path.expanduser("~")
APPLICATIONS_DIR = os.path.join(HOME_DIR, ".local/share/applications")
DESKTOP_FILE_PATH = os.path.join(APPLICATIONS_DIR, "launcher.desktop")
MIMEAPPS_FILE_PATH = os.path.join(APPLICATIONS_DIR, "mimeapps.list")
HANDLER_SCRIPT_PATH = os.path.join(HOME_DIR, "launcher.py")
AUTOSTART_PATH = "/home/pi/.config/lxsession/LXDE-pi/autostart"
AUTOSTART_FIREFOX_COMMAND = '@firefox -P "backup.profile" --no-remote --new-instance --kiosk "https://oshanotter.github.io/test"\n'
BACKUP_PROFILE_URL = "https://github.com/Oshanotter/test/raw/refs/heads/main/R%20Pi%20Config/backup.profile.zip"

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
    \"\"\"Creates a new Firefox profile based on the default profile, preserving formatting in profiles.ini.\"\"\"
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

    # Use RawConfigParser to preserve case & formatting
    config = configparser.RawConfigParser()
    config.optionxform = str  # Preserve key capitalization

    with open(profiles_ini_path, 'r') as configfile:
        config.read_file(configfile)

    # Check if the profile name already exists in the profiles.ini
    for section in config.sections():
        if config.has_option(section, 'Name') and config.get(section, 'Name') == new_profile_name:
            print(f"Profile '{new_profile_name}' already exists in profiles.ini, it won't be added again.")
            return

    # Find the next available profile index
    index = 0
    while f'Profile{index}' in config:
        index += 1

    # Add new profile entry while preserving correct formatting
    config.add_section(f'Profile{index}')
    config.set(f'Profile{index}', 'Name', new_profile_name)
    config.set(f'Profile{index}', 'IsRelative', '1')
    config.set(f'Profile{index}', 'Path', new_profile_name)
    config.set(f'Profile{index}', 'Default', '0')

    # Write back to profiles.ini with proper formatting
    with open(profiles_ini_path, 'w') as configfile:
        config.write(configfile, space_around_delimiters=False)  # Prevents adding spaces around '='

    print(f"Updated profiles.ini with new profile '{new_profile_name}'.")

def sync_firefox_settings(source_profile="backup.profile"):
    \"\"\"Copies extensions and settings from the backup profile into each of the other profiles,
    while avoiding login session transfer.
    \"\"\"

    if (source_profile == ""):
        sync_firefox_settings()
        return

    profile_dir = os.path.expanduser("~/.mozilla/firefox/")
    source_path = os.path.join(profile_dir, source_profile)

    files_to_copy = [
        "prefs.js",
        "search.json.mozlz4",
        "extensions.json",
        "extension-settings.json",
        "extension-preferences.json",
        "addons.json",
        "addonStartup.json.lz4",
        "permissions.sqlite"
    ]

    folders_to_copy = [
        "extensions",
        "extension-settings",
        "storage",
        "storage-sync2"
    ]

    for profile in os.listdir(profile_dir):
        profile_path = os.path.join(profile_dir, profile)

        # Exclude non-profile directories and specific folders
        if not os.path.isdir(profile_path) or profile in {source_profile, "Crash Reports", "Pending Pings"}:
            continue

        # Copy individual files
        for file in files_to_copy:
            src_file = os.path.join(source_path, file)
            dest_file = os.path.join(profile_path, file)
            if os.path.exists(src_file):
                print(src_file)
                shutil.copy2(src_file, dest_file)

        # Copy entire folders
        for folder in folders_to_copy:
            src_folder = os.path.join(source_path, folder)
            dest_folder = os.path.join(profile_path, folder)
            if os.path.exists(src_folder):
                shutil.copytree(src_folder, dest_folder, dirs_exist_ok=True)

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

        if app_name == "closeFirefox":
            # Start lxpanel with the LXDE-pi profile in the background
            subprocess.Popen(["lxpanel", "--profile", "LXDE-pi"])
            # Kill Firefox
            subprocess.run(["pkill", "firefox"])
            return

        # Special case for launching Firefox in kiosk mode
        if app_name == "firefox":
            if "/" in args:
                profile_name, url_to_open = args.split("/", 1)  # Split only on the first "/"
            else:
                profile_name = args if args else "default-release"
                url_to_open = "about:newtab"  # Default URL if none provided

            # Open Firefox in 'browser mode' if the user specified the url to be browser
            if url_to_open == "browser":
                # Quit lxpanel
                subprocess.run(["pkill", "lxpanel"])

                command = [
                    "firefox",
                    "-P", profile_name,
                    "--no-remote",
                    "--new-instance"
                ]
                subprocess.run(command)
                return

            else:
                # Use the user specified url to open Firefox in kiosk mode
                command = [
                    "firefox",
                    "-P", profile_name,
                    "--no-remote",
                    "--new-instance",
                    "--kiosk",
                    url_to_open
                ]
                subprocess.run(command)
                return
        else:
            # Run other applications normally
            command = [app_name] + args.split() if args else [app_name]
            subprocess.run(command)
            return

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
    print("To sync all Firefox profiles, use launcher://syncAllProfiles")












def enable_autostart():
    """Adds Firefox kiosk mode to the autostart file, preventing duplicate entries."""
    os.makedirs(os.path.dirname(AUTOSTART_PATH), exist_ok=True)

    if os.path.exists(AUTOSTART_PATH):
        with open(AUTOSTART_PATH, "r") as file:
            content = file.readlines()

        if AUTOSTART_FIREFOX_COMMAND in content:
            print("Autostart entry already exists. No changes made.")
            return

    with open(AUTOSTART_PATH, "a") as file:
        file.write(AUTOSTART_FIREFOX_COMMAND)

    print("Firefox autostart enabled! Reboot your Raspberry Pi to apply changes.")


def disable_autostart():
    """Removes Firefox kiosk mode from the autostart file."""
    if os.path.exists(AUTOSTART_PATH):
        with open(AUTOSTART_PATH, "r") as file:
            lines = file.readlines()

        with open(AUTOSTART_PATH, "w") as file:
            for line in lines:
                if line.strip() != AUTOSTART_FIREFOX_COMMAND.strip():
                    file.write(line)

        print("Firefox autostart disabled. Reboot to apply changes.")
    else:
        print("Autostart file not found. Nothing to remove.")

def install_backup_profile():
    """Installs the backup.profile to Firefox from GitHub"""
    # Define URLs and paths
    download_path = Path.home() / "backup.profile.zip"
    extract_path = Path.home() / "backup.profile"
    firefox_profiles_path = Path.home() / ".mozilla/firefox"
    profiles_ini_path = firefox_profiles_path / "profiles.ini"
    new_profile_name = "backup.profile"

    print("Installing the backup.profile...")

    # Download the zip file
    try:
        urllib.request.urlretrieve(BACKUP_PROFILE_URL, download_path)
    except Exception as e:
        print(f"Failed to download profile: {e}")
        return

    # Extract the zip file
    with zipfile.ZipFile(download_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path.parent)

    # Move the extracted folder to Firefox profiles directory
    profile_dest = firefox_profiles_path / new_profile_name
    if profile_dest.exists():
        os.system(f"rm -rf {profile_dest}")  # Remove any existing profile folder
    os.system(f"mv {extract_path} {profile_dest}")

    # Delete the downloaded zip file
    os.remove(download_path)

    # Update profiles.ini
    config = configparser.RawConfigParser()
    config.optionxform = str  # Preserve key capitalization

    if profiles_ini_path.exists():
        with open(profiles_ini_path, 'r') as configfile:
            config.read_file(configfile)

    # Check if the profile name already exists in the profiles.ini
    for section in config.sections():
        if config.has_option(section, 'Name') and config.get(section, 'Name') == new_profile_name:
            print(f"Profile '{new_profile_name}' already exists in profiles.ini, it won't be added again.")
            return


    # Find the next available profile index
    index = 0
    while f'Profile{index}' in config:
        index += 1

    # Add new profile entry while preserving correct formatting
    config.add_section(f'Profile{index}')
    config.set(f'Profile{index}', 'Name', new_profile_name)
    config.set(f'Profile{index}', 'IsRelative', '1')
    config.set(f'Profile{index}', 'Path', new_profile_name)
    config.set(f'Profile{index}', 'Default', '0')

    # Write back to profiles.ini with proper formatting
    with open(profiles_ini_path, "w") as configfile:
        config.write(configfile, space_around_delimiters=False)  # Prevents adding spaces around '='

    print("Firefox profile installed successfully.")



def ask_question(question, accepted_answers):
    """
    Asks the user a question and validates the response.

    Parameters:
    - question (str): The question to ask.
    - accepted_answers (list): A list where each item is an accepted answer.

    If the user provides an invalid response, they will be prompted again.
    """
    while True:
        user_input = input(question).strip()
        if user_input in accepted_answers:
            return user_input
        else:
            print("Invalid input. Please try again.\n")



def main():
    """Asks the user whether they want to enable or disable Firefox autostart."""

    autostart_answer = ask_question(
        "Do you want to have FEC autostart upon boot? (Yes/No/Exit):\n", ['Yes', 'No', 'Exit'])

    if autostart_answer == 'Yes':
        enable_autostart()
    elif autostart_answer == 'No':
        disable_autostart()
    elif autostart_answer == 'Exit':
        print("Exiting program.")
        return

    install_profile_answer = ask_question(
        "Do you want to install the backup.profile from GitHub? (Yes/No/Exit):\n", ['Yes', 'No', 'Exit'])

    if install_profile_answer == 'Yes':
        install_backup_profile()
    elif install_profile_answer == 'No':
        print("Make sure that the backup.profile exists in Firefox before running the FEC.\n")
    elif install_profile_answer == 'Exit':
        print("Exiting program.")
        return

    # Setup the launcher script that handles launcher:// links
    setup_launcher()

    if autostart_answer == 'Yes':
        reboot_answer = ask_question("Do you want to reboot now? (Yes/No):\n", ['Yes', 'No'])
        if reboot_answer == 'Yes':
            print("Rebooting now...")
            os.system("sudo reboot")  # Reboot the system
        else:
            print("Reboot skipped. Changes will take effect on the next boot.")


if __name__ == "__main__":
    main()
