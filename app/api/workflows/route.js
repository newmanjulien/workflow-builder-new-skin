// app/api/workflows/route.js
import { saveWorkflow, getWorkflows } from '../../lib/firestore';

export async function GET() {
  try {
    const workflows = await getWorkflows();
    return Response.json({ workflows });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await saveWorkflow(body);
    
    if (result.success) {
      return Response.json({ success: true, id: result.id });
    } else {
      return Response.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
