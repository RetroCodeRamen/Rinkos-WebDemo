# RinkOS Lua Reference

## Hello World Example
```lua
-- Simple Hello World
rink.print(10, 10, "Hello, RinkOS!")

-- Draw a box around the text
rink.drawBox(5, 5, 200, 30)
```

## Basic UI Functions
```lua
-- Clear the screen
rink.clear()

-- Print text at coordinates (x, y)
rink.print(x, y, "Text to display")

-- Draw a box
rink.drawBox(x, y, width, height)
```

## Menu Integration
```lua
-- Add your script to the main menu
rink.addMenu("My App", function()
    -- Your app's main function
    rink.clear()
    rink.print(10, 10, "Welcome to My App!")
end)
```

## Messaging Functions
```lua
-- Send a message to a user
rink.sendMessage("username", "Hello!")

-- Get all messages
local messages = rink.getMessages()
for i, msg in ipairs(messages) do
    rink.print(10, 10 + (i * 20), msg.sender .. ": " .. msg.text)
end

-- Get list of active users
local peers = rink.getPeers()
for i, peer in ipairs(peers) do
    rink.print(10, 10 + (i * 20), peer)
end
```

## Input Handling
```lua
-- Get user input
local input = rink.input()
rink.print(10, 10, "You typed: " .. input)
```

## Example: Simple Chat Client
```lua
-- A basic chat client example
rink.addMenu("Simple Chat", function()
    rink.clear()
    rink.print(10, 10, "Simple Chat Client")
    rink.print(10, 30, "Type a message:")
    
    local input = rink.input()
    if input then
        rink.sendMessage("recipient", input)
        rink.print(10, 50, "Message sent!")
    end
end)
```

## Tips
- Coordinates start from (0,0) at the top-left corner
- Text is drawn in black on white background
- Boxes are drawn with a 1px border
- The screen is cleared before each script execution
- Scripts can be saved and installed to the main menu 