<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReportSubmittedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $reporterName;
    public $reportedUser;
    public $severity;
    public $feedbackId;

    /**
     * Create a new message instance.
     */
    public function __construct($reporterName, $reportedUser, $severity, $feedbackId)
    {
        $this->reporterName = $reporterName;
        $this->reportedUser = $reportedUser;
        $this->severity = $severity;
        $this->feedbackId = $feedbackId;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Report Submitted - StudyHub',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.report-submitted',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
