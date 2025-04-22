/*import { Hardware_Components } from "../../../model/hardware_components";

const valid_hardware_component_1 = new Hardware_Components({name: "CPU", details: "Intel i9 10900k", price: 500});

test('given: valid values, when: creating hardware component, then: hardware component is created with those values', () => {
        
    // given // when
    const valid_hardware_component = {
        name: "CPU",
        details: "Intel i9 10900k",
        price: 500
    }

    // then
    expect(valid_hardware_component.name).toEqual("CPU");
    expect(valid_hardware_component.details).toEqual("Intel i9 10900k");
    expect(valid_hardware_component.price).toEqual(500);  
});

test('given: valid values, when: getting name, getting details, getting price, then: name, details, price are returned', () => {

    // given // when
    const name = valid_hardware_component_1.getName();
    const details = valid_hardware_component_1.getDetails();
    const price = valid_hardware_component_1.getPrice();

    // then
    expect(name).toEqual("CPU");
    expect(details).toEqual("Intel i9 10900k");
    expect(price).toEqual(500);
});

test('given: valid values, when: setting name, setting details, setting price, then: name, details, price are set', () => {

    // given
    const hardware_component = new Hardware_Components({name: "CPU", details: "Intel i9 10900k", price: 500});

    // when
    hardware_component.setName("GPU");
    hardware_component.setDetails("Nvidia RTX 3090");
    hardware_component.setPrice(1500);

    // then
    expect(hardware_component.getName()).toEqual("GPU");
    expect(hardware_component.getDetails()).toEqual("Nvidia RTX 3090");
    expect(hardware_component.getPrice()).toEqual(1500);
});*/
