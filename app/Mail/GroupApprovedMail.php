<?php

namespace App\Mail;

use App\Models\StudyGroup;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GroupApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $group;
    public $adminName;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, StudyGroup $group, $adminName)
    {
        $this->user = $user;
        $this->group = $group;
        $this->adminName = $adminName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Study Group Has Been Approved!',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.group-approved',
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
