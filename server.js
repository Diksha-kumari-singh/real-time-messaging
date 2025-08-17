
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios'; // For AI API
// Importing necessary modules

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

// OpenAI API key (or use HuggingFace)
const OPENAI_API_KEY='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';
io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('chat message', async ({ sender, message }) => {
        console.log(`Message from ${sender}: ${message}`);

        // Broadcast message to other users
        socket.broadcast.emit('chat message', { sender, message });

        // If receiver is messaging, generate auto-reply from donor (AI)
        if (sender === 'receiver') {
            const aiReply = await getAIReply(message);
            socket.emit('chat message', { sender: 'donor (AI)', message: aiReply });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});



  const getAIReply = async (userMessage) => {
    try {
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/distilgpt2', // Try 'gpt2' or 'distilgpt2'
            {
                inputs: userMessage
            },
            {
                headers: {
                  //  'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                    // Remove Authorization header for public models
                }
            }
        );
        // HuggingFace sometimes returns an object, not an array
        if (Array.isArray(response.data)) {
            return response.data[0]?.generated_text || "Sorry, I couldn't generate a reply.";
        } else if (response.data.generated_text) {
            return response.data.generated_text;
        } else {
            return "Sorry, I couldn't generate a reply.";
        }
    } catch (error) {
        console.error('AI Error:', error.message);
        return "Sorry, I'm unable to respond right now.";
    }
};
      

server.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});