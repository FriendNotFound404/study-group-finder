<?php

namespace App\Mail;

use App\Models\StudyGroup;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OwnershipTransferredMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $group;
    public $newOwner;
    public $isNewOwner;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, StudyGroup $group, User $newOwner, $isNewOwner = false)
    {
        $this->user = $user;
        $this->group = $group;
        $this->newOwner = $newOwner;
        $this->isNewOwner = $isNewOwner;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Group Ownership Transfer Notification',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.ownership-transferred',
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
