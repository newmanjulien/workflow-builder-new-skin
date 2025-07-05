import { updateWorkflowStatus } from '../../../../lib/firestore';

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const { isRunning } = body;
    
    if (typeof isRunning !== 'boolean') {
      return Response.json({ 
        success: false, 
        error: 'isRunning must be a boolean' 
      }, { status: 400 });
    }
    
    const result = await updateWorkflowStatus(params.id, isRunning);
    
    if (result.success) {
      return Response.json({ success: true });
    } else {
      return Response.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: 'Invalid request body' 
    }, { status: 400 });
  }
}
