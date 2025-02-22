from pynput import keyboard
import subprocess
import time

# Store the last time each key was pressed
last_press_time = {"volup": 0, "voldown": 0, "mute": 0}
DELAY = 0.15  # Time in seconds between repeated presses

# Function to send CEC command
def send_cec_command(command, key):
    global last_press_time
    current_time = time.time()

    # Set the systrem volume to 100% immediately
    subprocess.run(["amixer", "set", "Master", "100%"])
    # Uncomment the line below if sending the mute command to the tv works
    #subprocess.run(["amixer", "set", "Master", "unmute"])

    # Only send command if at least 1 second has passed
    if current_time - last_press_time[key] >= DELAY:
        subprocess.run(["tmux", "send-keys", "-t", "cec_session", command, "Enter"])
        last_press_time[key] = current_time  # Update last press time

# Function to handle key presses
def on_press(key):
    try:
        if key == keyboard.Key.media_volume_up:
            send_cec_command("volup", "volup")
        elif key == keyboard.Key.media_volume_down:
            send_cec_command("voldown", "voldown")
        elif key == keyboard.Key.media_volume_mute:
            send_cec_command("mute", "mute")
    except AttributeError:
        pass  # Ignore other keys

# Start listening
with keyboard.Listener(on_press=on_press) as listener:
    listener.join()
