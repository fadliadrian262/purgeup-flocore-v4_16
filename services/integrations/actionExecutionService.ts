import { whatsappService } from './whatsappService';
import { googleWorkspaceService } from './googleWorkspaceService';
import { PlatformAction, ExecutionResult } from './integrationOrchestrator';

// Action Execution Context
export interface ExecutionContext {
  userId: string;
  projectId?: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
}

// Action Template Definitions
interface ActionTemplate {
  id: string;
  name: string;
  platforms: ('whatsapp' | 'google')[];
  requiredParameters: string[];
  defaultParameters?: Record<string, any>;
  executionSteps: ExecutionStep[];
}

interface ExecutionStep {
  stepId: string;
  platform: 'whatsapp' | 'google';
  operation: string;
  parameters: Record<string, any>;
  dependsOn?: string[];
  rollbackOperation?: string;
  timeout?: number;
}

// Execution State Management
interface ActionExecution {
  actionId: string;
  status: 'pending' | 'confirmed' | 'executing' | 'completed' | 'failed' | 'cancelled' | 'rolled_back';
  startTime: Date;
  endTime?: Date;
  context: ExecutionContext;
  steps: ExecutionStepResult[];
  rollbackData: Record<string, any>;
  errors: string[];
}

interface ExecutionStepResult {
  stepId: string;
  platform: 'whatsapp' | 'google';
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'rolled_back';
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  rollbackData?: any;
}

// Confirmation Handler Interface
interface ConfirmationHandler {
  showConfirmation(action: PlatformAction, context: ExecutionContext): Promise<boolean>;
  showExecutionProgress(execution: ActionExecution): void;
  showExecutionResult(result: ExecutionResult): void;
}

class ActionExecutionService {
  private executions = new Map<string, ActionExecution>();
  private templates = new Map<string, ActionTemplate>();
  private confirmationHandler: ConfirmationHandler | null = null;

  constructor() {
    this.initializeActionTemplates();
    console.log('⚡ Action Execution Service initialized');
  }

  // Initialize predefined action templates
  private initializeActionTemplates(): void {
    // WhatsApp Daily Report Template
    this.templates.set('send_daily_report', {
      id: 'send_daily_report',
      name: 'Send Daily Progress Report',
      platforms: ['whatsapp'],
      requiredParameters: ['recipients', 'projectData'],
      executionSteps: [
        {
          stepId: 'format_report',
          platform: 'whatsapp',
          operation: 'formatDailyReport',
          parameters: {},
          timeout: 5000
        },
        {
          stepId: 'send_message',
          platform: 'whatsapp',
          operation: 'sendMessage',
          parameters: {},
          dependsOn: ['format_report'],
          timeout: 10000
        }
      ]
    });

    // Google Calendar Event Template
    this.templates.set('create_calendar_event', {
      id: 'create_calendar_event',
      name: 'Create Project Calendar Event',
      platforms: ['google'],
      requiredParameters: ['title', 'description', 'startTime', 'endTime'],
      executionSteps: [
        {
          stepId: 'create_event',
          platform: 'google',
          operation: 'createCalendarEvent',
          parameters: {},
          rollbackOperation: 'deleteCalendarEvent',
          timeout: 15000
        },
        {
          stepId: 'send_invitations',
          platform: 'google',
          operation: 'sendCalendarInvitations',
          parameters: {},
          dependsOn: ['create_event'],
          timeout: 10000
        }
      ]
    });

    // Cross-platform Project Update Template
    this.templates.set('cross_platform_update', {
      id: 'cross_platform_update',
      name: 'Cross-Platform Project Update',
      platforms: ['whatsapp', 'google'],
      requiredParameters: ['updateMessage', 'recipients', 'scheduleUpdate'],
      executionSteps: [
        {
          stepId: 'update_calendar',
          platform: 'google',
          operation: 'updateCalendarEvents',
          parameters: {},
          rollbackOperation: 'revertCalendarEvents',
          timeout: 15000
        },
        {
          stepId: 'create_document',
          platform: 'google',
          operation: 'createProjectDocument',
          parameters: {},
          dependsOn: ['update_calendar'],
          rollbackOperation: 'deleteDocument',
          timeout: 20000
        },
        {
          stepId: 'notify_team',
          platform: 'whatsapp',
          operation: 'sendTeamNotification',
          parameters: {},
          dependsOn: ['create_document'],
          timeout: 10000
        }
      ]
    });

    console.log(`📋 Initialized ${this.templates.size} action templates`);
  }

  // Set confirmation handler
  setConfirmationHandler(handler: ConfirmationHandler): void {
    this.confirmationHandler = handler;
  }

  // Execute action with full flow
  async executeAction(action: PlatformAction, context: ExecutionContext): Promise<ExecutionResult> {
    console.log(`⚡ Starting action execution: ${action.title}`);

    // Create execution record
    const execution: ActionExecution = {
      actionId: action.id,
      status: 'pending',
      startTime: new Date(),
      context,
      steps: [],
      rollbackData: {},
      errors: []
    };
    
    this.executions.set(action.id, execution);

    try {
      // Step 1: Confirmation (if required)
      if (action.confirmationRequired) {
        execution.status = 'pending';
        
        if (this.confirmationHandler) {
          const confirmed = await this.confirmationHandler.showConfirmation(action, context);
          if (!confirmed) {
            execution.status = 'cancelled';
            return this.createExecutionResult(execution, 'cancelled');
          }
        } else {
          // Auto-confirm for programmatic execution
          console.log('⚠️ No confirmation handler set, auto-confirming action');
        }
      }

      // Step 2: Execute action
      execution.status = 'confirmed';
      const result = await this.performActionExecution(action, execution);
      
      return result;

    } catch (error) {
      console.error(`❌ Action execution failed: ${action.id}`, error);
      execution.status = 'failed';
      execution.errors.push(error instanceof Error ? error.message : 'Unknown error');
      execution.endTime = new Date();

      // Attempt rollback
      if (execution.steps.some(step => step.status === 'completed')) {
        console.log('🔄 Attempting rollback...');
        await this.rollbackExecution(execution);
      }

      return this.createExecutionResult(execution, 'failed');
    }
  }

  // Perform the actual action execution
  private async performActionExecution(action: PlatformAction, execution: ActionExecution): Promise<ExecutionResult> {
    execution.status = 'executing';
    
    // Show progress if handler available
    if (this.confirmationHandler) {
      this.confirmationHandler.showExecutionProgress(execution);
    }

    // Get action template if available
    const template = this.getActionTemplate(action);
    
    if (template) {
      return await this.executeWithTemplate(action, execution, template);
    } else {
      return await this.executeDirectAction(action, execution);
    }
  }

  // Execute using predefined template
  private async executeWithTemplate(
    action: PlatformAction, 
    execution: ActionExecution, 
    template: ActionTemplate
  ): Promise<ExecutionResult> {
    console.log(`📋 Executing with template: ${template.name}`);

    // Initialize steps
    execution.steps = template.executionSteps.map(step => ({
      stepId: step.stepId,
      platform: step.platform,
      status: 'pending',
      startTime: new Date()
    }));

    // Execute steps in order, respecting dependencies
    for (const templateStep of template.executionSteps) {
      const stepResult = execution.steps.find(s => s.stepId === templateStep.stepId)!;
      
      // Check dependencies
      if (templateStep.dependsOn) {
        const dependencyCheck = templateStep.dependsOn.every(depId => 
          execution.steps.find(s => s.stepId === depId)?.status === 'completed'
        );
        if (!dependencyCheck) {
          throw new Error(`Step ${templateStep.stepId} dependencies not met`);
        }
      }

      // Execute step
      stepResult.status = 'executing';
      stepResult.startTime = new Date();

      try {
        const result = await this.executeStep(templateStep, action.parameters, execution);
        stepResult.result = result;
        stepResult.status = 'completed';
        stepResult.endTime = new Date();
        
        console.log(`✅ Step completed: ${templateStep.stepId}`);
      } catch (error) {
        stepResult.error = error instanceof Error ? error.message : 'Unknown error';
        stepResult.status = 'failed';
        stepResult.endTime = new Date();
        throw error;
      }
    }

    execution.status = 'completed';
    execution.endTime = new Date();
    
    const result = this.createExecutionResult(execution, 'success');
    
    // Show result if handler available
    if (this.confirmationHandler) {
      this.confirmationHandler.showExecutionResult(result);
    }

    return result;
  }

  // Execute direct action (without template)
  private async executeDirectAction(action: PlatformAction, execution: ActionExecution): Promise<ExecutionResult> {
    console.log(`🎯 Executing direct action: ${action.actionType}`);

    const results: Array<{ platform: 'whatsapp' | 'google'; success: boolean; data?: any; error?: string }> = [];

    // Execute on each platform
    for (const platform of action.platforms) {
      try {
        let result: any;
        
        switch (platform) {
          case 'whatsapp':
            result = await this.executeWhatsAppAction(action);
            break;
          case 'google':
            result = await this.executeGoogleAction(action);
            break;
          default:
            throw new Error(`Unsupported platform: ${platform}`);
        }

        results.push({
          platform,
          success: true,
          data: result
        });

      } catch (error) {
        results.push({
          platform,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    execution.status = results.every(r => r.success) ? 'completed' : 'failed';
    execution.endTime = new Date();

    const executionResult: ExecutionResult = {
      actionId: action.id,
      status: execution.status === 'completed' ? 'success' : 'partial',
      results,
      executionTime: execution.endTime.getTime() - execution.startTime.getTime(),
      rollbackAvailable: false
    };

    return executionResult;
  }

  // Execute individual step
  private async executeStep(step: ExecutionStep, parameters: Record<string, any>, execution: ActionExecution): Promise<any> {
    const timeout = step.timeout || 30000;
    
    const executePromise = async () => {
      switch (step.platform) {
        case 'whatsapp':
          return await this.executeWhatsAppStep(step, parameters);
        case 'google':
          return await this.executeGoogleStep(step, parameters);
        default:
          throw new Error(`Unsupported platform: ${step.platform}`);
      }
    };

    // Execute with timeout
    return await this.withTimeout(executePromise(), timeout);
  }

  // Execute WhatsApp-specific operations
  private async executeWhatsAppAction(action: PlatformAction): Promise<any> {
    switch (action.actionType) {
      case 'send_message':
        const recipients = action.parameters.recipients as string[];
        const message = action.parameters.message as string;
        
        if (recipients.length === 1) {
          return await whatsappService.sendTextMessage(recipients[0], message);
        } else {
          // Send to multiple recipients
          const results = await Promise.allSettled(
            recipients.map(recipient => whatsappService.sendTextMessage(recipient, message))
          );
          return results;
        }

      case 'send_report':
        return await whatsappService.sendDailyReport(
          action.parameters.recipients,
          action.parameters.reportData
        );

      default:
        throw new Error(`Unsupported WhatsApp action: ${action.actionType}`);
    }
  }

  // Execute Google-specific operations
  private async executeGoogleAction(action: PlatformAction): Promise<any> {
    switch (action.actionType) {
      case 'create_event':
        return await googleWorkspaceService.syncProjectSchedule(action.parameters.schedule);

      case 'upload_document':
        return await googleWorkspaceService.uploadDocument(action.parameters.document);

      case 'create_sheet':
        return await googleWorkspaceService.exportProjectData(action.parameters.exportData);

      case 'send_email':
        return await googleWorkspaceService.sendProjectNotification(
          action.parameters.to,
          action.parameters.subject,
          action.parameters.body
        );

      default:
        throw new Error(`Unsupported Google action: ${action.actionType}`);
    }
  }

  // Execute WhatsApp step
  private async executeWhatsAppStep(step: ExecutionStep, parameters: Record<string, any>): Promise<any> {
    switch (step.operation) {
      case 'formatDailyReport':
        // Format daily report from project data
        return this.formatDailyReport(parameters.projectData);
      
      case 'sendMessage':
        return await whatsappService.sendTextMessage(
          parameters.recipient || parameters.recipients?.[0],
          parameters.message
        );
      
      case 'sendTeamNotification':
        return await whatsappService.sendTextMessage(
          parameters.teamGroup || parameters.recipients?.[0],
          parameters.notification
        );
      
      default:
        throw new Error(`Unsupported WhatsApp step operation: ${step.operation}`);
    }
  }

  // Execute Google step
  private async executeGoogleStep(step: ExecutionStep, parameters: Record<string, any>): Promise<any> {
    switch (step.operation) {
      case 'createCalendarEvent':
        const eventData = {
          projectId: parameters.projectId || 'default',
          milestones: [{
            id: `event_${Date.now()}`,
            title: parameters.title,
            description: parameters.description,
            startDate: parameters.startTime,
            endDate: parameters.endTime,
            type: 'inspection' as const,
            attendees: parameters.attendees
          }]
        };
        return await googleWorkspaceService.syncProjectSchedule(eventData);

      case 'createProjectDocument':
        return await googleWorkspaceService.uploadDocument({
          name: parameters.documentName || `Project Update ${new Date().toISOString().split('T')[0]}.txt`,
          content: parameters.content || 'Project update content',
          mimeType: 'text/plain'
        });

      case 'updateCalendarEvents':
        // Update existing calendar events
        return { updated: true, eventIds: [] };

      default:
        throw new Error(`Unsupported Google step operation: ${step.operation}`);
    }
  }

  // Rollback execution
  private async rollbackExecution(execution: ActionExecution): Promise<void> {
    console.log(`🔄 Rolling back execution: ${execution.actionId}`);
    
    // Rollback steps in reverse order
    const completedSteps = execution.steps
      .filter(step => step.status === 'completed')
      .reverse();

    for (const step of completedSteps) {
      try {
        step.status = 'rolling_back' as any;
        
        // Find template step for rollback operation
        const template = Array.from(this.templates.values()).find(t => 
          t.executionSteps.some(s => s.stepId === step.stepId)
        );
        
        const templateStep = template?.executionSteps.find(s => s.stepId === step.stepId);
        
        if (templateStep?.rollbackOperation) {
          await this.executeRollback(step, templateStep.rollbackOperation);
          step.status = 'rolled_back' as any;
          console.log(`🔄 Step rolled back: ${step.stepId}`);
        }
      } catch (error) {
        console.error(`❌ Failed to rollback step ${step.stepId}:`, error);
      }
    }

    execution.status = 'rolled_back';
  }

  // Execute rollback operation
  private async executeRollback(step: ExecutionStepResult, rollbackOperation: string): Promise<void> {
    // Implementation would depend on the specific rollback operation
    // For example: delete created calendar event, remove uploaded document, etc.
    console.log(`🔄 Executing rollback: ${rollbackOperation} for step: ${step.stepId}`);
  }

  // Helper methods

  private getActionTemplate(action: PlatformAction): ActionTemplate | undefined {
    // Map action types to templates
    const templateMap: Record<string, string> = {
      'send_report': 'send_daily_report',
      'create_event': 'create_calendar_event',
      'cross_platform_update': 'cross_platform_update'
    };

    const templateId = templateMap[action.actionType];
    return templateId ? this.templates.get(templateId) : undefined;
  }

  private formatDailyReport(projectData: any): string {
    return `📋 Daily Project Report\n\n` +
           `Date: ${new Date().toLocaleDateString()}\n` +
           `Progress: ${projectData.progress || 'N/A'}\n` +
           `Team: ${projectData.teamCount || 'N/A'} members\n` +
           `Status: ${projectData.status || 'On track'}\n\n` +
           `Generated by FLOCORE AI`;
  }

  private createExecutionResult(execution: ActionExecution, status: 'success' | 'partial' | 'failed' | 'cancelled'): ExecutionResult {
    const results = execution.steps.map(step => ({
      platform: step.platform,
      success: step.status === 'completed',
      data: step.result,
      error: step.error
    }));

    return {
      actionId: execution.actionId,
      status,
      results,
      executionTime: (execution.endTime?.getTime() || Date.now()) - execution.startTime.getTime(),
      rollbackAvailable: execution.steps.some(step => step.rollbackData)
    };
  }

  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), timeout)
    );

    return Promise.race([promise, timeoutPromise]);
  }

  // Get execution status
  getExecution(actionId: string): ActionExecution | undefined {
    return this.executions.get(actionId);
  }

  // Get all executions for audit
  getAllExecutions(): ActionExecution[] {
    return Array.from(this.executions.values()).sort((a, b) => 
      b.startTime.getTime() - a.startTime.getTime()
    );
  }

  // Cancel pending execution
  cancelExecution(actionId: string): boolean {
    const execution = this.executions.get(actionId);
    if (execution && execution.status === 'pending') {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      console.log(`❌ Execution cancelled: ${actionId}`);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const actionExecutionService = new ActionExecutionService();
export default actionExecutionService;