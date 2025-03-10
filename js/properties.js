/**
 * Properties Module
 * 
 * Handles the properties panel functionality and object property updates.
 */

// Initialize the properties panel
function initProperties() {
    // Initialize position inputs
    document.getElementById('posX').addEventListener('change', updateObjectPosition);
    document.getElementById('posY').addEventListener('change', updateObjectPosition);
    
    // Initialize size inputs
    document.getElementById('width').addEventListener('change', updateObjectSize);
    document.getElementById('height').addEventListener('change', updateObjectSize);
    
    // Initialize stroke width input
    document.getElementById('stroke-width').addEventListener('change', updateObjectStroke);
    
    // Initialize opacity input
    document.getElementById('opacity').addEventListener('input', updateObjectOpacity);
    
    // Initialize color pickers
    initColorPickers();
}

// Initialize color pickers using Pickr
function initColorPickers() {
    // Fill color picker
    const fillPickr = Pickr.create({
        el: '#fill-color-picker',
        theme: 'classic',
        default: '#f0f0f0',
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                hsla: false,
                hsva: false,
                cmyk: false,
                input: true,
                clear: false,
                save: true
            }
        }
    });
    
    // Stroke color picker
    const strokePickr = Pickr.create({
        el: '#stroke-color-picker',
        theme: 'classic',
        default: '#000000',
        components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                hsla: false,
                hsva: false,
                cmyk: false,
                input: true,
                clear: false,
                save: true
            }
        }
    });
    
    // Fill color change event
    fillPickr.on('save', (color) => {
        if (appState.selectedObject) {
            const rgba = color.toRGBA();
            const rgbaString = `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`;
            
            appState.selectedObject.set('fill', rgbaString);
            appState.canvas.renderAll();
            
            // Save state for undo/redo
            saveState();
        }
        
        fillPickr.hide();
    });
    
    // Stroke color change event
    strokePickr.on('save', (color) => {
        if (appState.selectedObject) {
            const rgba = color.toRGBA();
            const rgbaString = `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`;
            
            appState.selectedObject.set('stroke', rgbaString);
            appState.canvas.renderAll();
            
            // Save state for undo/redo
            saveState();
        }
        
        strokePickr.hide();
    });
}

// Update the properties panel with the selected object's properties
function updatePropertiesPanel() {
    const posXInput = document.getElementById('posX');
    const posYInput = document.getElementById('posY');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const strokeWidthInput = document.getElementById('stroke-width');
    const opacityInput = document.getElementById('opacity');
    const opacityValue = document.getElementById('opacity-value');
    
    if (appState.selectedObject) {
        // Update position inputs
        posXInput.value = Math.round(appState.selectedObject.left);
        posYInput.value = Math.round(appState.selectedObject.top);
        
        // Update size inputs
        if (appState.selectedObject.width !== undefined) {
            widthInput.value = Math.round(appState.selectedObject.width * appState.selectedObject.scaleX);
        } else if (appState.selectedObject.radius !== undefined) {
            widthInput.value = Math.round(appState.selectedObject.radius * 2 * appState.selectedObject.scaleX);
        }
        
        if (appState.selectedObject.height !== undefined) {
            heightInput.value = Math.round(appState.selectedObject.height * appState.selectedObject.scaleY);
        } else if (appState.selectedObject.radius !== undefined) {
            heightInput.value = Math.round(appState.selectedObject.radius * 2 * appState.selectedObject.scaleY);
        }
        
        // Update stroke width input
        strokeWidthInput.value = appState.selectedObject.strokeWidth || 0;
        
        // Update opacity input
        const opacity = Math.round(appState.selectedObject.opacity * 100);
        opacityInput.value = opacity;
        opacityValue.textContent = `${opacity}%`;
        
        // Enable all inputs
        posXInput.disabled = false;
        posYInput.disabled = false;
        widthInput.disabled = false;
        heightInput.disabled = false;
        strokeWidthInput.disabled = false;
        opacityInput.disabled = false;
    } else {
        // Reset and disable all inputs
        posXInput.value = 0;
        posYInput.value = 0;
        widthInput.value = 100;
        heightInput.value = 100;
        strokeWidthInput.value = 1;
        opacityInput.value = 100;
        opacityValue.textContent = '100%';
        
        posXInput.disabled = true;
        posYInput.disabled = true;
        widthInput.disabled = true;
        heightInput.disabled = true;
        strokeWidthInput.disabled = true;
        opacityInput.disabled = true;
    }
}

// Update object position based on input values
function updateObjectPosition() {
    if (!appState.selectedObject) return;
    
    const posX = parseInt(document.getElementById('posX').value);
    const posY = parseInt(document.getElementById('posY').value);
    
    if (!isNaN(posX) && !isNaN(posY)) {
        appState.selectedObject.set({
            left: posX,
            top: posY
        });
        
        appState.canvas.renderAll();
        
        // Save state for undo/redo
        saveState();
    }
}

// Update object size based on input values
function updateObjectSize() {
    if (!appState.selectedObject) return;
    
    const width = parseInt(document.getElementById('width').value);
    const height = parseInt(document.getElementById('height').value);
    
    if (!isNaN(width) && !isNaN(height)) {
        if (appState.selectedObject.type === 'circle') {
            // For circles, use the average of width and height as diameter
            const radius = (width + height) / 4;
            appState.selectedObject.set({
                radius: radius,
                scaleX: 1,
                scaleY: 1
            });
        } else if (appState.selectedObject.type === 'line') {
            // For lines, adjust the end point
            const x1 = appState.selectedObject.x1;
            const y1 = appState.selectedObject.y1;
            
            appState.selectedObject.set({
                x2: x1 + width,
                y2: y1 + height
            });
        } else {
            // For rectangles and other objects
            appState.selectedObject.set({
                width: width,
                height: height,
                scaleX: 1,
                scaleY: 1
            });
        }
        
        appState.canvas.renderAll();
        
        // Save state for undo/redo
        saveState();
    }
}

// Update object stroke based on input value
function updateObjectStroke() {
    if (!appState.selectedObject) return;
    
    const strokeWidth = parseInt(document.getElementById('stroke-width').value);
    
    if (!isNaN(strokeWidth)) {
        appState.selectedObject.set({
            strokeWidth: strokeWidth
        });
        
        appState.canvas.renderAll();
        
        // Save state for undo/redo
        saveState();
    }
}

// Update object opacity based on input value
function updateObjectOpacity() {
    if (!appState.selectedObject) return;
    
    const opacity = parseInt(document.getElementById('opacity').value);
    const opacityValue = document.getElementById('opacity-value');
    
    if (!isNaN(opacity)) {
        opacityValue.textContent = `${opacity}%`;
        
        appState.selectedObject.set({
            opacity: opacity / 100
        });
        
        appState.canvas.renderAll();
        
        // Save state for undo/redo
        saveState();
    }
} 