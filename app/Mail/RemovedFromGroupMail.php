<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RemovedFromGroupMail extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;
    public $groupName;
    public $reason;

    /**
     * Create a new message instance.
     */
    public function __construct($userName, $groupName, $reason = null)
    {
        $this->userName = $userName;
        $this->groupName = $groupName;
        $this->reason = $reason ?? 'The group leader removed you from the group.';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Removed from Group - StudyHub',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.member-removed',
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
