param(
    [string]$DocumentPath = "$env:USERPROFILE\Desktop\VKR_Smyshlyaev_3.docx"
)

$ErrorActionPreference = "Stop"

function Normalize-ParagraphText {
    param([string]$Text)

    if ($null -eq $Text) {
        return ""
    }

    return ($Text -replace "`r", "" -replace "`a", "").Trim()
}

function Set-ParagraphFormatting {
    param(
        $Selection,
        [string]$FontName,
        [int]$FontSize,
        [bool]$Bold,
        [int]$Alignment
    )

    $Selection.Font.Name = $FontName
    $Selection.Font.Size = $FontSize
    $Selection.Font.Bold = if ($Bold) { 1 } else { 0 }
    $Selection.ParagraphFormat.Alignment = $Alignment
    $Selection.ParagraphFormat.LeftIndent = 0
    $Selection.ParagraphFormat.RightIndent = 0
    $Selection.ParagraphFormat.FirstLineIndent = 0
    $Selection.ParagraphFormat.SpaceAfter = 0
    $Selection.ParagraphFormat.SpaceBefore = 0
}

function Add-TextParagraph {
    param(
        $Selection,
        [string]$Text,
        [string]$FontName = "Times New Roman",
        [int]$FontSize = 12,
        [bool]$Bold = $false,
        [int]$Alignment = 0
    )

    Set-ParagraphFormatting -Selection $Selection -FontName $FontName -FontSize $FontSize -Bold $Bold -Alignment $Alignment
    $Selection.TypeText($Text)
    $Selection.TypeParagraph()
}

function Add-CodeFragment {
    param(
        $Selection,
        [string]$Caption,
        [string]$Code
    )

    Add-TextParagraph -Selection $Selection -Text $Caption -Alignment 1

    Set-ParagraphFormatting -Selection $Selection -FontName "Consolas" -FontSize 9 -Bold $false -Alignment 0
    foreach ($line in ($Code -split "`n")) {
        $Selection.TypeText($line.TrimEnd("`r"))
        $Selection.TypeParagraph()
    }

    $Selection.TypeParagraph()
}

$document = Get-Item -LiteralPath $DocumentPath
$backupPath = Join-Path $document.DirectoryName ($document.BaseName + "_backup_before_appendix_a_text.docx")
Copy-Item -LiteralPath $document.FullName -Destination $backupPath -Force

$captionIndices = @(558, 560, 562, 564)
$appendixBIndex = 566
$contentStartIndex = 556

$fragments = @(
    @'
appointment-service:
  environment:
    DB_HOST: appointment-db
    DB_PORT: 5432
    DB_NAME: appointment_db
    DB_USER: appointment_user
    DB_PASSWORD: ${APPOINTMENT_DB_PASSWORD:-appointment_password}

appointment-db:
  environment:
    POSTGRES_DB: appointment_db
    POSTGRES_USER: appointment_user
'@,
    @'
const withAccessToken = (config = {}) => {
  const token = getAccessToken();
  if (!token) {
    return config;
  }

  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };
};
'@,
    @'
boolean occupied = repo.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
        doctorId,
        date,
        time,
        AppointmentStatus.CANCELLED
);
if (occupied) {
    throw new IllegalArgumentException(...);
}
'@,
    @'
AppointmentStatus nextStatus = parseDoctorStatus(request.status());
appointment.setStatus(nextStatus);
if (nextStatus == AppointmentStatus.COMPLETED) {
    appointment.setCompletedAt(OffsetDateTime.now());
    appointment.setCompletionSummary(normalizeNullableText(request.completionSummary()));
}
Appointment saved = appointmentRepository.save(appointment);
'@
)

$word = $null
$doc = $null
$selection = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    $doc = $word.Documents.Open($document.FullName)

    $captions = foreach ($index in $captionIndices) {
        Normalize-ParagraphText $doc.Paragraphs.Item($index).Range.Text
    }

    $contentStart = $doc.Paragraphs.Item($contentStartIndex).Range.Start
    $contentEnd = $doc.Paragraphs.Item($appendixBIndex).Range.Start
    $doc.Range($contentStart, $contentEnd).Text = ""

    $selection = $word.Selection
    $selection.SetRange($contentStart, $contentStart)

    for ($i = 0; $i -lt $fragments.Count; $i++) {
        Add-CodeFragment -Selection $selection -Caption $captions[$i] -Code $fragments[$i]
    }

    $selection.InsertBreak(7)

    $doc.Save()
    Write-Output "UPDATED: $($document.FullName)"
    Write-Output "BACKUP: $backupPath"
}
finally {
    if ($doc -ne $null) {
        $doc.Close([ref]0)
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
    }
    if ($selection -ne $null) {
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($selection) | Out-Null
    }
    if ($word -ne $null) {
        $word.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    }
    [gc]::Collect()
    [gc]::WaitForPendingFinalizers()
}
