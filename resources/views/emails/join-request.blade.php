<x-mail::message>
# New Join Request

Hello,

**{{ $userName }}** wants to join your study group **"{{ $groupName }}"**.

Please review this request in your notifications and decide whether to approve or reject it.

<x-mail::button :url="config('app.url')">
View in StudyHub
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
