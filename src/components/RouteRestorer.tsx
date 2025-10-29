// src/components/RouteRestorer.tsx
// Component to restore the user's last visited route on app load

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoutePersistenceService } from '../services/routePersistenceService';

export const RouteRestorer: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();

	// Save current route whenever it changes
	useEffect(() => {
		RoutePersistenceService.saveCurrentRoute(location.pathname + location.search);
	}, [location.pathname, location.search]);

	// Restore last route on initial load (only at root path)
	useEffect(() => {
		// Only restore if we're at the root path and it's the initial load
		if (location.pathname === '/' && !sessionStorage.getItem('route_restored')) {
			const lastRoute = RoutePersistenceService.getLastRoute();
			
			// Mark that we've attempted restoration to prevent loops
			sessionStorage.setItem('route_restored', 'true');
			
			if (lastRoute && lastRoute !== '/') {
				console.log(`🔄 [RouteRestorer] Restoring last route: ${lastRoute}`);
				navigate(lastRoute, { replace: true });
			} else {
				console.log(`🏠 [RouteRestorer] No last route, staying at default`);
			}
		}
	}, [location.pathname, navigate]);

	return null;
};

export default RouteRestorer;


