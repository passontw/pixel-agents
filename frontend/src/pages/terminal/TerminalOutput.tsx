import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import type { TerminalLine, TerminalPart } from '../../mocks/terminal'

function Parts({ parts }: { parts: TerminalPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        typeof part === 'string' ? (
          <span key={index}>{part}</span>
        ) : (
          <Box key={index} component="code" sx={{ color: 'primary.light' }}>
            {part.code}
          </Box>
        ),
      )}
    </>
  )
}

function Line({ line }: { line: TerminalLine }) {
  switch (line.kind) {
    case 'blank':
      return <Box sx={{ height: '1em' }} />
    case 'field':
      return (
        <div>
          <Box component="span" sx={{ color: 'text.subtle' }}>
            {line.label}
          </Box>
          <span>{line.value}</span>
        </div>
      )
    case 'heading':
      return <Box sx={{ color: 'text.primary', fontWeight: 500 }}>{line.text}</Box>
    case 'item':
      return (
        <div>
          <Box component="span" sx={{ color: 'text.subtle' }}>
            {line.marker}
          </Box>
          <Parts parts={line.parts} />
        </div>
      )
    case 'finished':
      return (
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="span"
            sx={(theme) => ({
              width: theme.layout.dotSize.sidebar,
              height: theme.layout.dotSize.sidebar,
              borderRadius: '50%',
              backgroundColor: theme.vars.palette.primary.light,
            })}
          />
          <span>Agent </span>
          <Box component="span" sx={{ color: 'text.primary' }}>{`"${line.title}"`}</Box>
          <span> finished</span>
          <span>·</span>
          <span>{line.duration}</span>
        </Box>
      )
    case 'recap':
      return (
        <Box sx={{ mt: 2 }}>
          <Box component="span" sx={{ color: 'text.subtle' }}>
            ※ recap:{' '}
          </Box>
          <span>{line.text}</span>
          <Box component="span" sx={{ ml: 2, fontSize: '0.8em', color: 'text.ghost' }}>
            (disable recaps in /config)
          </Box>
        </Box>
      )
  }
}

/** 終端機輸出（靜態 mock）。 */
export function TerminalOutput({ lines }: { lines: TerminalLine[] }) {
  return (
    <Typography
      variant="code13"
      component="div"
      aria-label="terminal 輸出"
      sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}
    >
      {lines.map((line, index) => (
        <Line key={index} line={line} />
      ))}
      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box component="span" sx={{ color: 'text.ghost' }}>
          ›
        </Box>
        <Box
          component="span"
          sx={(theme) => ({
            width: '0.6em',
            height: '1.2em',
            backgroundColor: theme.vars.palette.primary.main,
          })}
        />
      </Box>
    </Typography>
  )
}
