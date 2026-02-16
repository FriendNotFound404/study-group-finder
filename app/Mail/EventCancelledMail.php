<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EventCancelledMail extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;
    public $groupName;
    public $eventTitle;
    public $eventTime;
    public $cancellationReason;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($userName, $groupName, $eventTitle, $eventTime, $cancellationReason = null)
    {
        $this->userName = $userName;
        $this->groupName = $groupName;
        $this->eventTitle = $eventTitle;
        $this->eventTime = $eventTime;
        $this->cancellationReason = $cancellationReason;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject("Meeting Cancelled: {$this->eventTitle}")
                    ->view('emails.event-cancelled');
    }
}
