<x-mail::message>
# New Member Joined

Hello,

Good news! **{{ $userName }}** has joined your study group **"{{ $groupName }}"**.

Your group is growing! You can view the updated member list in your group workspace.

<x-mail::button :url="config('app.url') . '/groups?group=' . $groupId">
View Group Workspace
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
