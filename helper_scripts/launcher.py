#!/usr/bin/env python3
import sys
import subprocess
import urllib.parse
import os
import shutil
import configparser

FEC_HOME_PAGE = "https://oshanotter.github.io/test"

def copy_firefox_profile(new_profile_name, source_profile="backup.profile"):
  """Creates a new Firefox profile based on the default profile, preserving formatting in profiles.ini."""
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
  """Copies extensions and settings from the backup profile into each of the other profiles,
  while avoiding login session transfer.
  """

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
      print("Launching the Forst Entertainment Center...")
      subprocess.run(['firefox', '-P', 'backup.profile', '--kiosk', FEC_HOME_PAGE])
      sys.exit(0)

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
