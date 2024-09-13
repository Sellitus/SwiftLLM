#!/bin/bash
if [ "$EUID" -eq 0 ]; then
    echo "This script should not be run with sudo."
    exit 1
fi

if [ $# -ne 3 ] && [ $# -ne 2 ]; then
    echo "Usage for Windows: $0 <platform> <architecture> <windows_user>"
    echo "Example: $0 win x64 selli"
    echo "Usage for MacOS: $0 <platform> <architecture>"
    echo "Example: $0 mac arm"
    exit 1
fi

if [ $# -eq 2 ]; then
    platform=$1
    architecture=$2
    windows_user=""
else
    platform=$1
    architecture=$2
    windows_user=$3
fi

if [ "$platform" != "win" ] && [ "$platform" != "mac" ]; then
    echo "Invalid platform. Please provide 'win' or 'mac' as the first argument."
    exit 1
fi

if [ "$architecture" != "arm" ] && [ "$architecture" != "x64" ]; then
    echo "Invalid architecture. Please provide 'arm' or 'x64' as the second argument."
    exit 1
fi





script_start_time=$(date +%s)



echo ""
echo ":: Building the app"
echo ""

npm run package-$platform-$architecture



end_time=$(date +%s)
execution_time=$((end_time - script_start_time))
echo ""
echo ":: Build app execution time: $(($execution_time / 60)) minutes and $(($execution_time % 60)) seconds."
echo ""

copy_start_time=$(date +%s)




if [ "$platform" == "win" ]; then
    echo ""
    echo ":: Copying the app to the Windows 11 desktop"
    echo ""

    /mnt/c/Windows/System32/taskkill.exe /F /IM "SwiftLLM.exe" &> /dev/null
    sleep 1

    cp -r builds/$platform-$architecture/* /mnt/c/Users/$windows_user/OneDrive/Desktop/SwiftLLM/

    subfolder_architecture=$(if [[ "$architecture" == "arm" ]]; then echo "arm64"; else echo "x64"; fi)
    /mnt/c/Users/selli/OneDrive/Desktop/SwiftLLM/SwiftLLM-win32-$subfolder_architecture/SwiftLLM.exe &> /dev/null &

else # platform == "mac"
    echo ""
    echo ":: Copying the app to the MacOS Applications folder"
    echo ""

    osascript -e 'quit app "SwiftLLM.app"'

    # set subfolder to arm64 if $architecture is 'arm', else set it to x64
    subfolder_architecture=$(if [[ "$architecture" == "arm" ]]; then echo "arm64"; else echo "x64"; fi)
    cp -r builds/mac-$architecture/SwiftLLM-darwin-$subfolder_architecture/SwiftLLM.app ~/Applications/

    open ~/Applications/SwiftLLM.app
fi



end_time=$(date +%s)
execution_time=$((end_time - copy_start_time))
echo ""
echo ":: Copy app execution time: $(($execution_time / 60)) minutes and $(($execution_time % 60)) seconds."
echo ""



execution_time=$((end_time - script_start_time))
# Print the execution time in an aesthetically pleasing way
echo ""
echo ""
echo ":: Full script execution time: $(($execution_time / 60)) minutes and $(($execution_time % 60)) seconds."
echo ""
echo ""
