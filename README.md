# Outline Bulk Document Mover

A Chrome extension that enables bulk document management in Outline wikis, allowing you to easily move multiple documents and their children between collections and folders.

## Features

- Move multiple documents and their children between collections
- Support for nested folder structures
- Document tree visualization with checkboxes for easy selection
- Automatic preservation of document hierarchies during moves
- Real-time collection and folder updates
- Secure API token management
- Connection testing capabilities
- Error handling and notifications

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Configuration

Before using the extension, you need to configure it with your Outline instance details:

1. Click the extension icon and select the settings icon (or right-click and choose "Options")
2. Enter your Outline instance URL (e.g., `https://your-outline-instance.com`)
3. Enter your API token (can be found in your Outline instance under Settings > API Tokens)
4. Click "Save" and optionally "Check Connection" to verify your settings

## Usage

### Moving Documents

1. Click the extension icon to open the document mover interface
2. Select the source collection from the dropdown
3. Check the boxes next to the documents you want to move
    - Use "Select All" to select all documents in the current view
    - Parent-child relationships are preserved during moves
4. Choose the destination collection
5. (Optional) Select a destination folder within the collection
6. Click "Move Selected Documents" to perform the move

### Refreshing Collections

- Click the "Refresh Collections" button to update the collection list if you've made changes in Outline

## Security

- API tokens are stored securely in Chrome's storage sync
- The extension only requires necessary permissions
- No data is sent to any third-party servers
- All operations are performed directly with your Outline instance

## Permissions

The extension requires the following permissions:
- `storage`: For saving your API token and settings
- `scripting`: For executing scripts to show notifications
- `notifications`: For displaying operation status
- `host_permissions`: For communicating with your Outline instance

## Development

### Project Structure

```
├── background.js          # Service worker for background tasks
├── manager.html          # Main UI for document management
├── manager.js           # Document management logic
├── options.html         # Settings page
├── options.js          # Settings management
├── outlineAPI.js       # Outline API wrapper
├── styles/             # CSS styles
│   ├── manager.css    # Styles for document manager
│   └── options.css    # Styles for settings page
└── utils/             # Utility functions
```

### Key Components

- `OutlineAPI`: Wrapper class for Outline API interactions
- `OptionsController`: Manages extension settings
- `DocumentManager`: Handles document tree visualization and moves
- Error handling system with retries and backoff
- Notification system for operation status

### Building and Testing

1. Make changes to the source code
2. Load the extension in Chrome using "Load unpacked"
3. Click the "Reload" button in `chrome://extensions/` to apply changes
4. Test functionality using the developer console

## Troubleshooting

### Common Issues

1. **Connection Failed**
    - Verify your Outline URL includes `https://`
    - Ensure your API token is correct
    - Check if your Outline instance is accessible

2. **Documents Not Loading**
    - Refresh the collections list
    - Check console for error messages
    - Verify API permissions

3. **Move Operation Failed**
    - Ensure destination collection exists
    - Check if you have write permissions
    - Verify document IDs are valid

### Debug Mode

Enable debug mode in `config.js` to see detailed logs in the console:

```javascript
export const DEBUG_MODE = true;
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open-source. See the LICENSE file for details.

## Support

For issues and feature requests, please use the GitHub issues page.

## Acknowledgments

- Built for Outline Wiki (https://www.getoutline.com/)
- Uses Chrome Extension APIs
- Thanks to all future contributors