import { Button } from '@mui/material';
import { styled } from '@mui/system';

export const ButtonStyled = styled(Button)(({ theme, }) => ({
	backgroundColor: theme.palette.primary.light,
	color: theme.palette.primary.darker,
	textDecoration: 'none !important',
	textTransform: 'initial',
	padding: '.5em 1.5em',
	'&:hover': {
		backgroundColor: theme.palette.primary.main,
	},
	transition: '.5s all',
	fontSize: '.9em',
}));
