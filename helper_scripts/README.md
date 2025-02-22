# Raspberry Pi Setup Instructions

This guide will walk you through the steps to switch to X11 and download and run the `setup_fec.py` script on a Raspberry Pi.

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
4. Navigate to the `Wayland` option.
5. Select the `X11` option.
6. Navigate to and select the `<Finish>` option.
7. You may reboot when it asks you, or you can wait for later, after executing the `setup_fec.py` file.


### 2. Download and Run `setup_fec.py`

1. Download the `setup_fec.py` file and place it on your desktop.
[Download setup_fec.py](helper_scripts/setup_fec.py)
2. Open the terminal and run the following command:
   ```bash
   python3 Desktop/setup_fec.py
   ```
3. The script will install several files and ask you several questions. If you are unsure about what to answer for these questions, just answer `Yes` to all of them.
4. You may move the `setup_fec.py` file to the trash after this is complete, if you wish.

---

## Troubleshooting

- **If the display server doesn’t switch to X11:**
  Ensure you selected `X11` in the `raspi-config` tool and rebooted the device.

- **If Firefox fails to launch in kiosk mode:**
  Ensure you’re running the X11 display server by verifying your session with:
  ```bash
  echo $XDG_SESSION_TYPE
  ```
  This should return `x11`.

- **If the `setup_fec.py` file fails to install the required tools:**
  pynput, cec-utils, and tmux are tools required to make the FEC function properly.
  If the `setup_fec.py` file did not install them correctly, manually install them with the following command:
  ```bash
  sudo apt install python3-pynput
  sudo apt install cec-utils
  sudo apt install tmux
  ```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
