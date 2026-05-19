const express = require('express')
const cors = require('cors');
const app = express()
require('dotenv').config();

// swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');




//import routers
const AppointmentRoutes = require('./routes/AppointmentRoutes')
const AssistantRoutes = require('./routes/AssisstantRoutes')
const AuthRoutes = require('./routes/AuthRoutes')
const DoctorRoutes = require('./routes/DoctorRoutes')
const NotificationRoutes = require('./routes/NotificationRoutes')
const PatientRoutes = require('./routes/PatientRoutes')
const TestRoutes = require('./routes/TestRoutes')
const Admin1Routes = require('./routes/Admin/AdminRoutes')


//MIddlewares
app.use(cors({
  origin : process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials : true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

//Routes
app.use('/appointment', AppointmentRoutes);
app.use('/assistant', AssistantRoutes);
app.use('/auth', AuthRoutes);
app.use('/doctor', DoctorRoutes);
app.use('/notification', NotificationRoutes);
app.use('/patient', PatientRoutes);
app.use('/test', TestRoutes);
app.use('/admin', Admin1Routes)


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});