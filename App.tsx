    useEffect(() => {
        Object.entries(colors).forEach(([key, value]) => {
            document.documentElement.style.setProperty(COLOR_VAR_MAP[key], value as string);
        });
        localStorage.setItem('maiflix-colors', JSON.stringify(colors));
    }, [colors]);