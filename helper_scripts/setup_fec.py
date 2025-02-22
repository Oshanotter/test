import os
import subprocess
import shutil
import zipfile
import urllib.request
import configparser
from pathlib import Path

# Paths
HOME_DIR = os.path.expanduser("~")
APPLICATIONS_DIR = os.path.join(HOME_DIR, ".local/share/applications")
FEC_HELPER_SCRIPTS_FOLDER = os.path.join(HOME_DIR, ".fec_helper_scripts")
SOURCE_AUTOSTART_PATH = "/etc/xdg/lxsession/LXDE-pi/autostart"
DEST_AUTOSTART_PATH = ".config/lxsession/LXDE-pi/autostart"
GITHUB_BASE_PATH = "https://github.com/Oshanotter/test/raw/refs/heads/main/"
BACKUP_PROFILE_URL = GITHUB_BASE_PATH + "helper_scripts/backup.profile.zip"
LAUNCHER_SCRIPT_URL = GITHUB_BASE_PATH + "helper_scripts/launcher.py"
KEY_BINDINGS_SCRIPT_URL = GITHUB_BASE_PATH + "helper_scripts/key_bindings.py"
START_CEC_CLIENT_SCRIPT_URL = GITHUB_BASE_PATH + "helper_scripts/start_cec_client.py"
FEC_ICON = GITHUB_BASE_PATH + "media/icons/fec_logo_rounded.png"


def create_desktop_file():
    """
    Create the .desktop file to register the 'launcher://' URL scheme.
    """
    ICON_PATH = os.path.join(APPLICATIONS_DIR, "FEC_icon.png")
    LAUNCHER_SCRIPT_PATH = os.path.join(FEC_HELPER_SCRIPTS_FOLDER, os.path.basename(LAUNCHER_SCRIPT_URL))
    DESKTOP_FILE_PATH = os.path.join(APPLICATIONS_DIR, "launcher.desktop")

    # Download the FEC icon for the .desktop file
    try:
        urllib.request.urlretrieve(FEC_ICON, ICON_PATH)
    except Exception as e:
        print(f"Failed to download icon: {e}")

    desktop_file_content = f"""[Desktop Entry]
Name=Forst Entertainment Cneter
Exec={LAUNCHER_SCRIPT_PATH} %u
Type=Application
MimeType=x-scheme-handler/launcher;
Icon={ICON_PATH}
"""

    os.makedirs(APPLICATIONS_DIR, exist_ok=True)
    with open(DESKTOP_FILE_PATH, "w") as f:
        f.write(desktop_file_content)

def create_mimeapps_list():
    """
    Create or update the mimeapps.list file with the custom URL scheme.
    """
    MIMEAPPS_FILE_PATH = os.path.join(APPLICATIONS_DIR, "mimeapps.list")

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
    print("Creating .desktop file...")
    create_desktop_file()
    print("Creating mimeapps.list file...")
    create_mimeapps_list()
    print("Registering the custom URL scheme...")
    register_url_scheme()
    print("\nSetup complete! Use launcher://<app_name> to open apps.")
    print("For example, use launcher://firefox/userName/https://youtube.com to launch Firefox in kiosk mode.")
    print("To create a new Firefox profile, use launcher://createProfile/NewProfileName")
    print("To sync all Firefox profiles, use launcher://syncAllProfiles")
    print() # Newline


def enable_autostart():
    """Copies the default autostart file and adds Firefox kiosk mode."""
    os.makedirs(os.path.dirname(DEST_AUTOSTART_PATH), exist_ok=True)

    shutil.copy(SOURCE_AUTOSTART_PATH, DEST_AUTOSTART_PATH)

    with open(DEST_AUTOSTART_PATH, "r") as file:
        content = file.readlines()

    urls = [
        LAUNCHER_SCRIPT_URL,
        KEY_BINDINGS_SCRIPT_URL,
        START_CEC_CLIENT_SCRIPT_URL
    ]

    AUTOSTART_FEC_COMMAND = ""

    for url in urls:
        command = "@python3 " + os.path.join(FEC_HELPER_SCRIPTS_FOLDER, os.path.basename(url)) + "\n"
        AUTOSTART_FEC_COMMAND += command


    if AUTOSTART_FEC_COMMAND in content:
        print("FEC autostart entry already exists. No changes made.\n")
        return

    with open(DEST_AUTOSTART_PATH, "a") as file:
        file.write(AUTOSTART_FEC_COMMAND)

    print("FEC autostart enabled! Reboot to apply changes.\n")

def disable_autostart():
    """Removes the autostart file entirely."""
    if os.path.exists(DEST_AUTOSTART_PATH):
        os.remove(DEST_AUTOSTART_PATH)
        print("FEC autostart file deleted. Reboot to apply changes.\n")
    else:
        print("FEC autostart file not found. No changes made.\n")

def install_backup_profile():
    """Installs the backup.profile to Firefox from GitHub"""
    # Define URLs and paths
    download_path = os.path.expanduser("~/backup.profile.zip")
    extract_path = os.path.expanduser("~/backup.profile")
    firefox_profiles_path = os.path.expanduser("~/.mozilla/firefox")
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


def download_helper_scripts():
    # Ensure the directory exists
    os.makedirs(FEC_HELPER_SCRIPTS_FOLDER, exist_ok=True)

    # List of URLs
    urls = [
        LAUNCHER_SCRIPT_URL,
        KEY_BINDINGS_SCRIPT_URL,
        START_CEC_CLIENT_SCRIPT_URL
    ]

    print("Downloading helper scripts...")

    for url in urls:
        filename = os.path.join(FEC_HELPER_SCRIPTS_FOLDER, os.path.basename(url))
        print(f"...downloading {filename}...")
        urllib.request.urlretrieve(url, filename)

        # Make the file executable
        os.chmod(filename, 0o755)


def install_required_tools():
    tools = [
        ("pynput", ["sudo", "apt", "install", "-y", "python3-pynput"]),
        ("cec-utils", ["sudo", "apt", "install", "-y", "cec-utils"]),
        ("tmux", ["sudo", "apt", "install", "-y", "tmux"])
    ]

    print("\nYou may be prompted for your password to install required tools.")
    for tool, command in tools:
        print(f"----------Installing {tool}...")
        subprocess.run(command, check=True)

    print("\n All required tools are installed and updated.\n")


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

    install_tools_answer = ask_question("Additional tools need to be installed to use the Forst Entertainment Center. \nDo you wish to install them?", ["Yes", "No")
    if install_tools_answer == "Yes":
        install_required_tools()
    else:
        print("These tools need to be installed for the FEC to function.\nNowExiting...")
        return

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


    # Download the helper scripts from GitHub
    download_helper_scripts()

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
