import { toast } from 'react-toastify';

export const v4ToastManager = {
	showSuccess: (message: string) => {
		toast.success(message, {
			position: 'top-right',
			autoClose: 5000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
		});
	},

	showError: (message: string) => {
		toast.error(message, {
			position: 'top-right',
			autoClose: 5000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
		});
	},

	showInfo: (message: string) => {
		toast.info(message, {
			position: 'top-right',
			autoClose: 5000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
		});
	},

	showWarning: (message: string) => {
		toast.warn(message, {
			position: 'top-right',
			autoClose: 5000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
		});
	},
};

export default v4ToastManager;
