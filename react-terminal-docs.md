import { render, Text, Box } from 'ink';
import Markdown from 'ink-markdown';
import { useState, useCallback } from 'react';
import { useChat } from 'ai/react'; // Vercel AI SDK

function StreamingMessage({ agentId }: { agentId: string }) {
  const { messages, input, handleSubmit, isLoading } = useChat({
    api: '/openrouter-proxy', // Your backend or direct call
    body: { model: 'anthropic/claude-sonnet-4', agentId },
  });

  return (
    <Box flexDirection="column" padding={1}>
      {messages.map(m => (
        <Box key={m.id} marginY={1}>
          <Box width={2}>
            <Text color={m.role === 'assistant' ? 'green' : 'blue'}>
              {m.role === 'assistant' ? '◆' : '◇'}
            </Text>
          </Box>
          
          <Box flexGrow={1}>
            {m.role === 'assistant' ? (
              // Streaming markdown with syntax highlighting
              <Markdown 
                components={{
                  code: ({ className, children }) => (
                    <Box 
                      backgroundColor="#1e1e1e" 
                      paddingX={1} 
                      borderStyle="round"
                    >
                      <Text color="#d4d4d4">{children}</Text>
                    </Box>
                  )
                }}
              >
                {m.content}
              </Markdown>
            ) : (
              <Text bold>{m.content}</Text>
            )}
          </Box>
        </Box>
      ))}
      
      {isLoading && (
        <Box>
          <Spinner type="dots" />
          <Text dimColor> Agent thinking...</Text>
        </Box>
      )}
    </Box>
  );
}