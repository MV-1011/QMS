import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Check if email is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn('Email not configured - skipping email send');
      return false;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"QMS Pharmacy" <noreply@qmspharmacy.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
};

// Email templates
export const emailTemplates = {
  trainingAssigned: (data: {
    userName: string;
    trainingTitle: string;
    dueDate: string;
    assignedBy: string;
    pharmacyName: string;
  }) => ({
    subject: `New Training Assigned: ${data.trainingTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .highlight { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Training Assignment</h1>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            <p>A new training has been assigned to you:</p>
            <div class="highlight">
              <strong>Training:</strong> ${data.trainingTitle}<br>
              <strong>Due Date:</strong> ${data.dueDate}<br>
              <strong>Assigned By:</strong> ${data.assignedBy}
            </div>
            <p>Please complete this training before the due date.</p>
            <a href="#" class="button">Start Training</a>
          </div>
          <div class="footer">
            <p>${data.pharmacyName} - Quality Management System</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${data.userName},\n\nA new training has been assigned to you:\n\nTraining: ${data.trainingTitle}\nDue Date: ${data.dueDate}\nAssigned By: ${data.assignedBy}\n\nPlease complete this training before the due date.\n\n${data.pharmacyName} - Quality Management System`,
  }),

  trainingReminder: (data: {
    userName: string;
    trainingTitle: string;
    dueDate: string;
    daysLeft: number;
    pharmacyName: string;
  }) => ({
    subject: `Reminder: Training Due in ${data.daysLeft} Days - ${data.trainingTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Training Reminder</h1>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            <div class="warning">
              <strong>Reminder:</strong> Your training "${data.trainingTitle}" is due in <strong>${data.daysLeft} days</strong>.
            </div>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
            <p>Please complete this training before the due date to remain compliant.</p>
            <a href="#" class="button">Continue Training</a>
          </div>
          <div class="footer">
            <p>${data.pharmacyName} - Quality Management System</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${data.userName},\n\nReminder: Your training "${data.trainingTitle}" is due in ${data.daysLeft} days.\n\nDue Date: ${data.dueDate}\n\nPlease complete this training before the due date to remain compliant.\n\n${data.pharmacyName} - Quality Management System`,
  }),

  certificateIssued: (data: {
    userName: string;
    trainingTitle: string;
    certificateNumber: string;
    issueDate: string;
    expiryDate?: string;
    pharmacyName: string;
  }) => ({
    subject: `Certificate Issued: ${data.trainingTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #11998e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .certificate-box { background: white; border: 2px solid #11998e; padding: 20px; border-radius: 8px; text-align: center; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Congratulations!</h1>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            <p>Congratulations on completing your training! Your certificate has been issued.</p>
            <div class="certificate-box">
              <h2>${data.trainingTitle}</h2>
              <p><strong>Certificate Number:</strong> ${data.certificateNumber}</p>
              <p><strong>Issue Date:</strong> ${data.issueDate}</p>
              ${data.expiryDate ? `<p><strong>Valid Until:</strong> ${data.expiryDate}</p>` : ''}
            </div>
            <a href="#" class="button">Download Certificate</a>
          </div>
          <div class="footer">
            <p>${data.pharmacyName} - Quality Management System</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${data.userName},\n\nCongratulations on completing your training! Your certificate has been issued.\n\nTraining: ${data.trainingTitle}\nCertificate Number: ${data.certificateNumber}\nIssue Date: ${data.issueDate}${data.expiryDate ? `\nValid Until: ${data.expiryDate}` : ''}\n\n${data.pharmacyName} - Quality Management System`,
  }),

  examAvailable: (data: {
    userName: string;
    trainingTitle: string;
    examTitle: string;
    passingScore: number;
    timeLimit?: number;
    pharmacyName: string;
  }) => ({
    subject: `Exam Available: ${data.examTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .info-box { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Exam Ready</h1>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            <p>You have completed the training content for "${data.trainingTitle}". Your exam is now available.</p>
            <div class="info-box">
              <strong>Exam:</strong> ${data.examTitle}<br>
              <strong>Passing Score:</strong> ${data.passingScore}%<br>
              ${data.timeLimit ? `<strong>Time Limit:</strong> ${data.timeLimit} minutes` : ''}
            </div>
            <p>Good luck!</p>
            <a href="#" class="button">Start Exam</a>
          </div>
          <div class="footer">
            <p>${data.pharmacyName} - Quality Management System</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${data.userName},\n\nYou have completed the training content for "${data.trainingTitle}". Your exam is now available.\n\nExam: ${data.examTitle}\nPassing Score: ${data.passingScore}%${data.timeLimit ? `\nTime Limit: ${data.timeLimit} minutes` : ''}\n\nGood luck!\n\n${data.pharmacyName} - Quality Management System`,
  }),
};

export default {
  sendEmail,
  emailTemplates,
};
