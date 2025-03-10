# Figma Clone

A modern web-based design tool similar to Figma, built with HTML, CSS, and JavaScript.

## Features

### Core Design Features
- Canvas with zooming and panning
- Shape creation tools (rectangle, circle, line)
- Text insertion capability
- Object selection, moving, and resizing
- Object styling (fill color, border, opacity)
- Layer management system

### Advanced Features
- **Components System**: Create reusable components and instances
- **Auto Layout**: Create responsive layouts with automatic spacing and alignment
- **Constraints**: Define how objects resize and reposition when their parent frame changes size
- **Advanced Prototyping**: Create interactive prototypes with transitions and animations
- **Version History**: Track changes and restore previous versions
- **Collaboration**: Work with others in real-time with comments and cursor sharing
- **Export Functionality**: Export designs as images
- **Local Storage**: Persist designs between sessions

## Technologies Used

- **Tailwind CSS** - Utility-first CSS framework for styling
- **Material Design Icons** - Google's Material Design icon library
- **shadcn/ui** - UI component styling inspiration
- **Fabric.js** - Canvas manipulation and object handling
- **Pickr** - Color picker
- **FileSaver.js** - Export functionality
- **Mousetrap** - Keyboard shortcuts

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. Start designing!

### Production Deployment Note

This project currently uses the Tailwind CSS CDN for development purposes. For production deployment, it's recommended to:

1. Install Tailwind CSS as a PostCSS plugin or use the Tailwind CLI
2. Generate an optimized CSS build
3. Replace the CDN link with your compiled CSS file

See the [Tailwind CSS Installation Guide](https://tailwindcss.com/docs/installation) for more details.

## Usage

### Tools

- **Select Tool**: Click on objects to select them
- **Rectangle Tool**: Click and drag to create rectangles
- **Circle Tool**: Click and drag to create circles
- **Line Tool**: Click and drag to create lines
- **Text Tool**: Click to add text

### Components

- **Create Component**: Select an object and press Alt+C or use the Components panel
- **Create Instance**: Click the "+" button next to a component in the Components panel
- **Update Component**: Make changes to a component to update all instances

### Auto Layout

- **Add Auto Layout**: Select a frame and press Shift+A or use the Auto Layout button
- **Change Direction**: Switch between horizontal and vertical layouts
- **Adjust Spacing**: Control the space between items
- **Set Alignment**: Align items within the auto layout frame

### Constraints

- **Set Constraints**: Define how objects behave when their parent frame is resized
- **Horizontal Constraints**: Left, Right, Center, Scale, or Left-Right
- **Vertical Constraints**: Top, Bottom, Center, Scale, or Top-Bottom

### Prototyping

- **Add Interaction**: Create click, hover, or drag interactions
- **Set Transitions**: Choose from various animation types
- **Preview Prototype**: Test your interactive prototype

### Version History

- **Save Version**: Create named versions of your design
- **View History**: See all saved versions
- **Restore Version**: Revert to a previous version

### Collaboration

- **Add Comments**: Leave feedback on designs
- **See Collaborators**: View who's currently working on the design
- **Invite Users**: Add new collaborators to the project

### Navigation

- **Pan**: Hold Alt or middle mouse button and drag
- **Zoom**: Use mouse wheel or the zoom controls in the status bar

### Keyboard Shortcuts

#### Tools
- `V` - Select tool
- `R` - Rectangle tool
- `O` - Circle tool
- `L` - Line tool
- `T` - Text tool

#### View
- `Space + Drag` - Pan canvas
- `Cmd/Ctrl + =` - Zoom in
- `Cmd/Ctrl + -` - Zoom out
- `Cmd/Ctrl + 0` - Reset zoom to 100%
- `Cmd/Ctrl + 1` - Fit to screen

#### Edit
- `Cmd/Ctrl + C` - Copy selected object
- `Cmd/Ctrl + X` - Cut selected object
- `Cmd/Ctrl + V` - Paste object
- `Cmd/Ctrl + D` - Duplicate selected object
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` - Redo
- `Delete/Backspace` - Delete selected object
- `Cmd/Ctrl + S` - Save design

#### Object Manipulation
- `Cmd/Ctrl + G` - Group selected objects
- `Cmd/Ctrl + Shift + G` - Ungroup objects
- `Arrow keys` - Nudge selected object by 1px
- `Shift + Arrow keys` - Nudge selected object by 10px

#### Components and Prototyping
- `Alt + C` - Create component from selection
- `Shift + A` - Add auto layout to selected frame
- `Alt + P` - Toggle prototype mode

## Project Structure

- `index.html` - Main HTML file
- `css/styles.css` - CSS styles
- `js/app.js` - Main application logic
- `js/canvas.js` - Canvas initialization and management
- `js/tools.js` - Drawing tools implementation
- `js/properties.js` - Properties panel functionality
- `js/layers.js` - Layers panel functionality
- `js/storage.js` - Local storage functionality
- `js/components.js` - Components system
- `js/autolayout.js` - Auto layout system
- `js/constraints.js` - Constraints system
- `js/prototyping.js` - Prototyping system
- `js/version-history.js` - Version history system
- `js/collaboration.js` - Collaboration system

## UI Features

- Modern, clean interface with Tailwind CSS
- Material Design icons for better visual representation
- Dropdown menus for File, Edit, View, Object, and Help options
- Interactive layer management with visibility toggles and quick actions
- Responsive property controls
- Real-time collaboration UI with user cursors and comments

## License

MIT 