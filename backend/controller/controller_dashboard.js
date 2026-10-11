import { DashboardModel } from '../models/models_dashboard.js';
import { manejar } from '../helpers/http.js';
 
export const resumen = manejar(async (_req, res) => {
  res.set('Cache-Control', 'no-store'); // datos de negocio: que el navegador no los guarde
  res.json(await DashboardModel.resumen());
});
 


