import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.routes";
import organizationRoutes from "./routes/organization.routes";
import collaboratorRoutes from "./routes/collaborator.routes";
import projectRoutes from "./routes/project.routes";
import projectCollaboratorRoutes from "./routes/projectCollaborator.routes";
import personalProjectRouter from "./routes/personalProject";
import planRoutes from "./routes/plan.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import billingAddressRoutes from "./routes/billingAddress.routes";
import paymentMethodRoutes from "./routes/paymentMethod.routes";
import billingHistoryRoutes from "./routes/billingHistory.routes";
import usageRoutes from "./routes/usage.routes";
import webhookRoutes from "./routes/webhook.routes";
import contentBuilderRoutes from "./routes/contentBuilder.routes";
import contentManagementRoutes from "./routes/contentManagement.routes";
import mediaManagementRoutes from "./routes/mediaManagement.routes";
import apiTokenRoutes from "./routes/apiToken.routes";
import workflowRoutes from "./routes/workflow.routes";
import mediaAssetRoutes from "./routes/mediaAsset.routes";
import mediaFolderRoutes from "./routes/mediaFolder.routes";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/collaborators", collaboratorRoutes); 
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/project-collaborators", projectCollaboratorRoutes);
app.use("/api/v1/personal-projects", personalProjectRouter);

app.use("/api/v1", planRoutes);                  
app.use('/api/v1', subscriptionRoutes);            
app.use('/api/v1', billingAddressRoutes);          
app.use('/api/v1', paymentMethodRoutes);           
app.use('/api/v1', billingHistoryRoutes);         
app.use('/api/v1', usageRoutes);                 
app.use('/api/v1/webhooks', webhookRoutes);              

app.use("/api/v1/content-builder", contentBuilderRoutes);
app.use("/api/v1/content-management", contentManagementRoutes);
app.use("/api/v1/media-management", mediaManagementRoutes);
app.use("/api/v1", apiTokenRoutes);
app.use("/api/v1", workflowRoutes);

app.use('/api/v1', mediaAssetRoutes);
app.use('/api/v1', mediaFolderRoutes);

app.listen(3000, () => {
    console.log("Server Running on http://localhost:3000");
});

export default app;