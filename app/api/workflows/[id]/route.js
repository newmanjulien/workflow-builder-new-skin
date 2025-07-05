// app/api/workflows/[id]/route.js
import { getWorkflow, updateWorkflow, deleteWorkflow } from '../../../lib/firestore';

export async function GET(request, { params }) {
  try {
    const workflow = await getWorkflow(params.id);
    
    if (workflow) {
      return Response.json({ workflow });
    } else {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }
  } catch (error) {
    return Response.json({ error: 'Failed to fetch workflow' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const result = await updateWorkflow(params.id, body);
    
    if (result.success) {
      return Response.json({ success: true });
    } else {
      return Response.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const result = await deleteWorkflow(params.id);
    
    if (result.success) {
      return Response.json({ success: true });
    } else {
      return Response.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to delete workflow' }, { status: 500 });
  }
}
