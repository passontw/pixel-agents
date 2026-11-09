import SvgIcon from '@mui/material/SvgIcon'

// 三個箭頭由深到淺的品牌紫，顏色全部取自 theme。
export function Logo() {
  return (
    <SvgIcon
      viewBox="0 0 20 20"
      fill="none"
      sx={(theme) => ({
        width: 20,
        height: 20,
        '& path': { strokeLinecap: 'round', strokeLinejoin: 'round' },
        '& path:nth-of-type(1)': { stroke: theme.vars.palette.primary.main, strokeWidth: 2.5 },
        '& path:nth-of-type(2)': {
          stroke: `color-mix(in srgb, ${theme.vars.palette.primary.main}, ${theme.vars.palette.primary.light})`,
          strokeWidth: 2,
        },
        '& path:nth-of-type(3)': { stroke: theme.vars.palette.primary.light, strokeWidth: 1.5 },
      })}
    >
      <path d="M2 6L7 10L2 14" />
      <path d="M7 6L12 10L7 14" />
      <path d="M12 6L17 10L12 14" />
    </SvgIcon>
  )
}
