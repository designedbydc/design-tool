/**
 * Collaboration System
 * 
 * Handles real-time collaboration between multiple users.
 * Note: This is a simplified implementation that simulates collaboration features.
 * In a real-world scenario, this would use WebSockets or a similar technology.
 */

// Store for collaboration data
const collaborationStore = {
    users: [],
    currentUser: null,
    comments: [],
    isCollaborationEnabled: false,
    simulatedUsers: [
        { id: 'user1', name: 'Alex Kim', color: '#FF5733', avatar: 'AK' },
        { id: 'user2', name: 'Jordan Smith', color: '#33A1FF', avatar: 'JS' },
        { id: 'user3', name: 'Taylor Chen', color: '#33FF57', avatar: 'TC' }
    ]
};

// Initialize collaboration system
function initCollaboration() {
    // Create collaboration panel
    createCollaborationPanel();
    
    // Set up current user
    setupCurrentUser();
    
    // Add simulated users (for demo purposes)
    addSimulatedUsers();
}

// Create collaboration panel in the UI
function createCollaborationPanel() {
    // Create collaboration panel container
    const collaborationPanel = document.createElement('div');
    collaborationPanel.className = 'collaboration-panel bg-white border border-gray-200 rounded-md shadow-lg';
    collaborationPanel.style.position = 'absolute';
    collaborationPanel.style.top = '80px';
    collaborationPanel.style.right = '16px';
    collaborationPanel.style.width = '300px';
    collaborationPanel.style.maxHeight = '500px';
    collaborationPanel.style.overflow = 'auto';
    collaborationPanel.style.zIndex = '100';
    collaborationPanel.style.display = 'none';
    
    // Create panel header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-3 border-b border-gray-200';
    
    const title = document.createElement('h3');
    title.className = 'text-sm font-medium text-gray-700';
    title.textContent = 'Collaboration';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-500 hover:text-gray-700';
    closeButton.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">close</span>';
    closeButton.onclick = () => {
        collaborationPanel.style.display = 'none';
    };
    
    header.appendChild(title);
    header.appendChild(closeButton);
    collaborationPanel.appendChild(header);
    
    // Create users section
    const usersSection = document.createElement('div');
    usersSection.className = 'p-3 border-b border-gray-200';
    
    const usersHeader = document.createElement('div');
    usersHeader.className = 'flex justify-between items-center mb-2';
    
    const usersTitle = document.createElement('h4');
    usersTitle.className = 'text-xs font-medium text-gray-600';
    usersTitle.textContent = 'Users';
    
    const inviteButton = document.createElement('button');
    inviteButton.className = 'text-xs text-blue-500 hover:text-blue-600';
    inviteButton.textContent = '+ Invite';
    inviteButton.onclick = inviteUser;
    
    usersHeader.appendChild(usersTitle);
    usersHeader.appendChild(inviteButton);
    usersSection.appendChild(usersHeader);
    
    // Create users list
    const usersList = document.createElement('div');
    usersList.id = 'users-list';
    usersList.className = 'space-y-2';
    usersSection.appendChild(usersList);
    
    collaborationPanel.appendChild(usersSection);
    
    // Create comments section
    const commentsSection = document.createElement('div');
    commentsSection.className = 'p-3';
    
    const commentsHeader = document.createElement('div');
    commentsHeader.className = 'flex justify-between items-center mb-2';
    
    const commentsTitle = document.createElement('h4');
    commentsTitle.className = 'text-xs font-medium text-gray-600';
    commentsTitle.textContent = 'Comments';
    
    commentsHeader.appendChild(commentsTitle);
    commentsSection.appendChild(commentsHeader);
    
    // Create comments list
    const commentsList = document.createElement('div');
    commentsList.id = 'comments-list';
    commentsList.className = 'space-y-2 mb-3';
    commentsSection.appendChild(commentsList);
    
    // Create comment input
    const commentForm = document.createElement('div');
    commentForm.className = 'flex items-start gap-2';
    
    const commentInput = document.createElement('input');
    commentInput.type = 'text';
    commentInput.id = 'comment-input';
    commentInput.className = 'flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm';
    commentInput.placeholder = 'Add a comment...';
    
    const commentButton = document.createElement('button');
    commentButton.className = 'px-3 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600';
    commentButton.textContent = 'Send';
    commentButton.onclick = addComment;
    
    commentForm.appendChild(commentInput);
    commentForm.appendChild(commentButton);
    commentsSection.appendChild(commentForm);
    
    collaborationPanel.appendChild(commentsSection);
    
    // Add panel to the document
    document.body.appendChild(collaborationPanel);
    
    // Add button to menu bar to toggle collaboration panel
    const menuBar = document.querySelector('.menu-bar');
    const collaborationButton = document.createElement('button');
    collaborationButton.className = 'ml-2 px-3 py-1.5 rounded hover:bg-gray-100 flex items-center';
    collaborationButton.innerHTML = '<span class="material-symbols-outlined mr-1">people</span> Collaborate';
    collaborationButton.onclick = () => {
        collaborationPanel.style.display = collaborationPanel.style.display === 'none' ? 'block' : 'none';
        if (collaborationPanel.style.display === 'block') {
            updateUsersList();
            updateCommentsList();
        }
    };
    menuBar.appendChild(collaborationButton);
    
    // Add user cursors container
    const cursorsContainer = document.createElement('div');
    cursorsContainer.id = 'user-cursors';
    document.body.appendChild(cursorsContainer);
}

// Set up current user
function setupCurrentUser() {
    // Generate a random user ID
    const userId = 'user_' + Date.now();
    
    // Create current user object
    collaborationStore.currentUser = {
        id: userId,
        name: 'You',
        color: '#FF9900',
        avatar: 'You'
    };
    
    // Add to users list
    collaborationStore.users.push(collaborationStore.currentUser);
}

// Add simulated users (for demo purposes)
function addSimulatedUsers() {
    // Add simulated users to the users list
    collaborationStore.users = collaborationStore.users.concat(collaborationStore.simulatedUsers);
    
    // Update users list
    updateUsersList();
    
    // Simulate user cursors
    simulateUserCursors();
}

// Invite a new user
function inviteUser() {
    // In a real implementation, this would show a dialog to enter email addresses
    // and send invitations to collaborate
    
    // For demo purposes, we'll just show an alert
    alert('In a real implementation, this would allow you to invite users via email.');
}

// Add a comment
function addComment() {
    const commentInput = document.getElementById('comment-input');
    const commentText = commentInput.value.trim();
    
    if (!commentText) return;
    
    // Create comment object
    const comment = {
        id: 'comment_' + Date.now(),
        userId: collaborationStore.currentUser.id,
        text: commentText,
        timestamp: Date.now()
    };
    
    // Add to comments list
    collaborationStore.comments.push(comment);
    
    // Update comments list
    updateCommentsList();
    
    // Clear input
    commentInput.value = '';
    
    // Simulate response from another user
    simulateCommentResponse();
}

// Update the users list in the UI
function updateUsersList() {
    const usersList = document.getElementById('users-list');
    if (!usersList) return;
    
    // Clear the list
    usersList.innerHTML = '';
    
    // Add users to the list
    collaborationStore.users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item flex items-center gap-2 p-2 rounded-md ' + 
            (user.id === collaborationStore.currentUser.id ? 'bg-blue-50' : '');
        
        // User avatar
        const avatar = document.createElement('div');
        avatar.className = 'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium';
        avatar.style.backgroundColor = user.color;
        avatar.textContent = user.avatar;
        
        // User name
        const name = document.createElement('div');
        name.className = 'text-sm';
        name.textContent = user.name;
        
        userItem.appendChild(avatar);
        userItem.appendChild(name);
        
        usersList.appendChild(userItem);
    });
}

// Update the comments list in the UI
function updateCommentsList() {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;
    
    // Clear the list
    commentsList.innerHTML = '';
    
    // Add comments to the list
    if (collaborationStore.comments.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-sm text-gray-500 text-center py-4';
        emptyMessage.textContent = 'No comments yet.';
        commentsList.appendChild(emptyMessage);
    } else {
        collaborationStore.comments.forEach(comment => {
            const commentItem = document.createElement('div');
            commentItem.className = 'comment-item p-3 border border-gray-200 rounded-md';
            
            // Find the user
            const user = collaborationStore.users.find(u => u.id === comment.userId);
            
            // Comment header
            const header = document.createElement('div');
            header.className = 'flex items-center gap-2 mb-1';
            
            // User avatar
            const avatar = document.createElement('div');
            avatar.className = 'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium';
            avatar.style.backgroundColor = user ? user.color : '#999';
            avatar.textContent = user ? user.avatar : '?';
            
            // User name
            const name = document.createElement('div');
            name.className = 'text-xs font-medium';
            name.textContent = user ? user.name : 'Unknown User';
            
            // Timestamp
            const timestamp = document.createElement('div');
            timestamp.className = 'text-xs text-gray-500 ml-auto';
            timestamp.textContent = new Date(comment.timestamp).toLocaleTimeString();
            
            header.appendChild(avatar);
            header.appendChild(name);
            header.appendChild(timestamp);
            
            // Comment text
            const text = document.createElement('div');
            text.className = 'text-sm';
            text.textContent = comment.text;
            
            commentItem.appendChild(header);
            commentItem.appendChild(text);
            
            commentsList.appendChild(commentItem);
        });
    }
    
    // Scroll to bottom
    commentsList.scrollTop = commentsList.scrollHeight;
}

// Simulate user cursors
function simulateUserCursors() {
    const cursorsContainer = document.getElementById('user-cursors');
    if (!cursorsContainer) return;
    
    // Create cursor elements for simulated users
    collaborationStore.simulatedUsers.forEach(user => {
        const cursor = document.createElement('div');
        cursor.className = 'user-cursor absolute pointer-events-none';
        cursor.style.zIndex = '1000';
        
        // Cursor pointer
        const pointer = document.createElement('div');
        pointer.className = 'w-5 h-5 transform -translate-x-1/2 -translate-y-1/2';
        pointer.innerHTML = `
            <svg viewBox="0 0 24 24" fill="${user.color}">
                <path d="M7,2l15,15l-5,0l-2,5l-2-10l-6,0z" stroke="#fff" stroke-width="1"></path>
            </svg>
        `;
        
        // User label
        const label = document.createElement('div');
        label.className = 'ml-4 px-2 py-1 rounded text-xs text-white whitespace-nowrap';
        label.style.backgroundColor = user.color;
        label.textContent = user.name;
        
        cursor.appendChild(pointer);
        cursor.appendChild(label);
        cursorsContainer.appendChild(cursor);
        
        // Simulate random cursor movement
        simulateCursorMovement(cursor);
    });
}

// Simulate cursor movement
function simulateCursorMovement(cursor) {
    // Get canvas bounds
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) return;
    
    const bounds = canvasContainer.getBoundingClientRect();
    
    // Set initial position
    let x = bounds.left + Math.random() * bounds.width;
    let y = bounds.top + Math.random() * bounds.height;
    
    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';
    
    // Simulate movement
    setInterval(() => {
        // Random movement
        x += (Math.random() - 0.5) * 20;
        y += (Math.random() - 0.5) * 20;
        
        // Keep within bounds
        x = Math.max(bounds.left, Math.min(bounds.left + bounds.width, x));
        y = Math.max(bounds.top, Math.min(bounds.top + bounds.height, y));
        
        // Update position
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
    }, 1000);
}

// Simulate comment response
function simulateCommentResponse() {
    // Wait a random time between 5-10 seconds
    const delay = 5000 + Math.random() * 5000;
    
    setTimeout(() => {
        // Pick a random simulated user
        const user = collaborationStore.simulatedUsers[Math.floor(Math.random() * collaborationStore.simulatedUsers.length)];
        
        // Create response comment
        const responses = [
            'Great idea!',
            'I like this design.',
            'Maybe we should try a different approach?',
            'Let me think about this...',
            'This looks good to me!',
            'Can we adjust the colors a bit?',
            'What if we move this element to the right?',
            'I think this is coming along nicely.'
        ];
        
        const comment = {
            id: 'comment_' + Date.now(),
            userId: user.id,
            text: responses[Math.floor(Math.random() * responses.length)],
            timestamp: Date.now()
        };
        
        // Add to comments list
        collaborationStore.comments.push(comment);
        
        // Update comments list
        updateCommentsList();
    }, delay);
}

// Export functions
window.collaborationSystem = {
    init: initCollaboration,
    addComment: addComment,
    inviteUser: inviteUser
}; 