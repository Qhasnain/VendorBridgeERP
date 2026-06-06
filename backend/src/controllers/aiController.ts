import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getInvoiceInsights, answerProcurementQuestion } from '../services/aiService';

export async function getInvoiceInsightsEndpoint(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const insights = await getInvoiceInsights(parseInt(id));
    return res.json(insights);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function chatAssistantEndpoint(req: AuthenticatedRequest, res: Response) {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message query is required' });
  }

  try {
    const responseText = await answerProcurementQuestion(message);
    return res.json({ response: responseText });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
