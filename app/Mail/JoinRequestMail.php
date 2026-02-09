<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class JoinRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public $leaderName;
    public $userName;
    public $groupName;

    /**
     * Create a new message instance.
     */
    public function __construct($leaderName, $userName, $groupName)
    {
        $this->leaderName = $leaderName;
        $this->userName = $userName;
        $this->groupName = $groupName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Join Request - StudyHub',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.join-request',
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
