
Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

folder = FSO.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = folder

WshShell.Run "cmd /c python app.py", 0, False

WScript.Sleep 5000

WshShell.Run "http://127.0.0.1:5000/", 1, False
