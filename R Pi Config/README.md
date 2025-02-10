# Raspberry Pi Setup Instructions

This guide will walk you through the steps to switch to X11, install `xdotool`, and download and run the `setup_launcher.py` script on a Raspberry Pi.

## Prerequisites

Ensure you have:
- A Raspberry Pi running Raspberry Pi OS.
- Internet access.
- Basic familiarity with the terminal.

---

## Steps

### 1. Switch to X11

To switch to X11 on a Raspberry Pi:

1. Open a terminal.
2. Run the following command:
   ```bash
   sudo raspi-config
   ```
3. Navigate to `Advanced Options`.
4. Select `X11` from the `Wayland` option.
5. Reboot your Raspberry Pi to apply the changes:
   ```bash
   sudo reboot
   ```

### 2. Install `xdotool`

`xdotool` is a command-line utility that simulates keyboard input and mouse activity.

1. Open a terminal.
2. Update your package list:
   ```bash
   sudo apt update
   ```
3. Install `xdotool`:
   ```bash
   sudo apt install -y xdotool
   ```
4. Verify the installation by running:
   ```bash
   xdotool -v
   ```

### 3. Download and Run `setup_launcher.py`

1. Navigate to a directory where you want to store the script:
   ```bash
   cd ~/Downloads
   ```
2. Download the `setup_launcher.py` script from this repository:
   ```bash
   wget https://github.com/your-repo-name/your-repo-name/raw/main/setup_launcher.py
   ```
   Replace `your-repo-name` with your actual repository name.
3. Make the script executable:
   ```bash
   chmod +x setup_launcher.py
   ```
4. Run the script:
   ```bash
   python3 setup_launcher.py
   ```

---

## Troubleshooting

- **If the display server doesn’t switch to X11:**
  Ensure you selected `X11` in the `raspi-config` tool and rebooted the device.

- **If `xdotool` commands fail:**
  Ensure you’re running the X11 display server by verifying your session with:
  ```bash
  echo $XDG_SESSION_TYPE
  ```
  This should return `x11`.

---

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests to improve this guide or the script.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
