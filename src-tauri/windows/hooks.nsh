; WOWCCM Player 설치 훅 (Tauri NSIS 설치 파일에 끼워 넣는다)
;
; 설치 직전에 "이전 와우씨씨엠 플레이어"가 깔려 있는지 찾아 보고,
; 있으면 삭제할지 물은 뒤 그 프로그램의 원래 삭제 도구를 실행한다.
;
; - Windows "앱 및 기능" 목록(Uninstall 레지스트리)에서 이름에 WOWCCM 또는 와우씨씨엠이
;   들어간 프로그램을 찾는다. 새 플레이어 자신(설치 폴더가 같은 것)은 건너뛴다.
; - 조용히 설치(/S)할 때는 묻지 않고 건너뛴다.
; - 이 파일보다 앞에서 설치 템플릿이 LogicLib, x64, StrFunc(${StrLoc}), SetContext 를 불러 둔다.

Var WowccmOldName
Var WowccmOldCmd
Var WowccmOldExe
Var WowccmOldArgs

; 삭제 명령(UninstallString)을 실행 파일과 인자로 나눈다
;   "C:\Program Files\X\unins000.exe" /x  →  C:\Program Files\X\unins000.exe | /x
;   MsiExec.exe /X{GUID}                   →  MsiExec.exe | /X{GUID}
;   C:\Program Files\X\uninstall.exe       →  (공백이 있어도 파일이 있으면 통째로 실행 파일)
Function WowccmSplitCmd
  Push $0
  Push $1
  StrCpy $WowccmOldExe $WowccmOldCmd
  StrCpy $WowccmOldArgs ""
  StrCpy $0 $WowccmOldCmd 1
  ${If} $0 == '"'
    StrCpy $0 $WowccmOldCmd "" 1
    ${StrLoc} $1 $0 '"' ">"
    ${If} $1 != ""
      StrCpy $WowccmOldExe $0 $1
      IntOp $1 $1 + 1
      StrCpy $WowccmOldArgs $0 "" $1
    ${EndIf}
  ${ElseIfNot} ${FileExists} $WowccmOldCmd
    ${StrLoc} $1 $WowccmOldCmd " " ">"
    ${If} $1 != ""
      StrCpy $WowccmOldExe $WowccmOldCmd $1
      IntOp $1 $1 + 1
      StrCpy $WowccmOldArgs $WowccmOldCmd "" $1
    ${EndIf}
  ${EndIf}
  Pop $1
  Pop $0
FunctionEnd

Function WowccmOfferUninstall
  IfSilent wowccm_offer_done
  MessageBox MB_YESNO|MB_ICONQUESTION "이전 버전의 와우씨씨엠 플레이어가 설치되어 있습니다.$\n$\n    $WowccmOldName$\n$\n새 플레이어를 설치하면 이전 플레이어는 더 이상 필요하지 않습니다.$\n지금 이전 플레이어를 삭제할까요?$\n$\n(삭제 창이 뜨면 안내에 따라 진행해 주세요)" IDYES wowccm_offer_yes
  Goto wowccm_offer_done
  wowccm_offer_yes:
    Call WowccmSplitCmd
    ; ExecShellWait: 이전 플레이어 삭제 도구가 관리자 권한을 요구해도 권한 창(UAC)이 뜨도록 한다
    ExecShellWait "open" "$WowccmOldExe" "$WowccmOldArgs"
  wowccm_offer_done:
FunctionEnd

; ROOT 의 Uninstall 목록을 훑는다. ID 는 레이블이 겹치지 않게 하는 이름표
!macro WOWCCM_SCAN ROOT ID
  StrCpy $R0 0
  wowccm_scan_${ID}:
    ClearErrors
    EnumRegKey $R1 ${ROOT} "Software\Microsoft\Windows\CurrentVersion\Uninstall" $R0
    IfErrors wowccm_done_${ID}
    StrCmp $R1 "" wowccm_done_${ID}
    IntOp $R0 $R0 + 1
    ReadRegStr $R2 ${ROOT} "Software\Microsoft\Windows\CurrentVersion\Uninstall\$R1" "DisplayName"
    ReadRegStr $R3 ${ROOT} "Software\Microsoft\Windows\CurrentVersion\Uninstall\$R1" "UninstallString"
    StrCmp $R3 "" wowccm_scan_${ID}
    ; 새 플레이어 자신(같은 설치 폴더)은 건너뛴다
    ${StrLoc} $R4 $R3 $INSTDIR ">"
    StrCmp $R4 "" 0 wowccm_scan_${ID}
    ${StrLoc} $R4 $R2 "WOWCCM" ">"
    StrCmp $R4 "" 0 wowccm_found_${ID}
    ${StrLoc} $R4 $R2 "와우씨씨엠" ">"
    StrCmp $R4 "" wowccm_scan_${ID} wowccm_found_${ID}
  wowccm_found_${ID}:
    StrCpy $WowccmOldName $R2
    StrCpy $WowccmOldCmd $R3
    Call WowccmOfferUninstall
    Goto wowccm_scan_${ID}
  wowccm_done_${ID}:
!macroend

!macro NSIS_HOOK_PREINSTALL
  Push $R0
  Push $R1
  Push $R2
  Push $R3
  Push $R4
  ; 64비트 Windows에서는 64비트·32비트 프로그램 목록을 모두 본다
  ${If} ${RunningX64}
    SetRegView 64
    !insertmacro WOWCCM_SCAN HKLM lm64
  ${EndIf}
  SetRegView 32
  !insertmacro WOWCCM_SCAN HKLM lm32
  !insertmacro WOWCCM_SCAN HKCU cu
  ; 설치 템플릿이 쓰던 레지스트리 보기로 되돌린다
  !insertmacro SetContext
  Pop $R4
  Pop $R3
  Pop $R2
  Pop $R1
  Pop $R0
!macroend
