<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RoleChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $oldRole;
    public $newRole;
    public $adminName;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, $oldRole, $newRole, $adminName)
    {
        $this->user = $user;
        $this->oldRole = $oldRole;
        $this->newRole = $newRole;
        $this->adminName = $adminName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Role Has Been Updated',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.role-changed',
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
