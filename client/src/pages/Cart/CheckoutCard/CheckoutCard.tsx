import { Grid, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { enqueueSnackbar } from 'notistack';
import React from 'react';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { BackdropLoading } from '../../../components/BackdropLoading';
import { DateTimePicker } from '../../../components/DateTimePicker/DateTimePicker';
import { createOrder as createOrderAction } from '../../../store/features/orders/orders.actions';
import { useTypedSelector } from '../../../store/utils/useTypedSelector';
import ProductChoicesType from '../../../types/Product/ProductChoicesType';
import ProductType from '../../../types/Product/ProductType';
import brlCurrencyFormatter from '../../../utils/brlCurrencyFormatter';
import getTotalPriceOfProduct from '../../../utils/getTotalPriceOfProduct';
import { MainCard } from './CheckoutCard.styled';

type Props = {
	fetchProductsLoading: boolean;
	products: ProductType[];
	productsChoices: ProductChoicesType[];
}

export const CheckoutCard: React.FunctionComponent<Props> = ({ fetchProductsLoading, products, productsChoices, }) => {
	const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
	const { request, loading, previousType, } = useTypedSelector((state) => state.auth);

	const onCheckoutClick = (dateTime: dayjs.Dayjs | null): void => {
		const now = dayjs();
		now.add(1, 'day');
		now.set('hour', 0).set('minutes', 0).set('second', 0);

		if (!dateTime || dateTime < now) {
			enqueueSnackbar('Data ou horário inválidos', { variant : 'error', });
			return;
		}

		dispatch(createOrderAction(dateTime));
	};

	return (
		<MainCard sx={{ py: 2, }}>
			<BackdropLoading open={fetchProductsLoading} />

			<Grid display="flex" flexDirection="column" gap={3} maxWidth="384px" sx={{ overflowX: 'auto', }}>
				<Typography variant="h6" sx={{ px: 1, }}>
					Total:&nbsp;
					{fetchProductsLoading ? 'R$ 0,00' : 
						brlCurrencyFormatter.format(productsChoices.reduce((sum, pc) => sum + getTotalPriceOfProduct(products.find(p => p.id === pc.id), pc), 0))
					}
				</Typography>
				<DateTimePicker
					orientation="portrait"
					okButtonLabel="Fazer Pedido"
					onAccept={onCheckoutClick}
				/>
				<Typography variant="body1" textAlign="justify" sx={{ px: 1, }}>Todas as nossas entregas são feitas no Bloco 1B na Universidade Federal de Uberlândia!</Typography>
				<Typography variant="body1" textAlign="justify" sx={{ px: 1, }}>Após a finalização do pedido, compareça no local na data e horário marcados para receber seu pedido. Nós iremos te mandar uma mensagem via whatsapp quando estivermos no local.</Typography>
				<Typography variant="body1" textAlign="justify" sx={{ px: 1, }}>Se você deseja receber o pedido em outro local ou precisar de alguma ajuda, entre em contato com o Rafael ou Fellype pelo whatsapp abaixo.</Typography>
			</Grid>
		</MainCard>
	);
};